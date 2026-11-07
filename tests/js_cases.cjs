'use strict';
// Independent expected outcomes exercise the same modules loaded by the HTML.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const P = require('../Study Flow/js/planning.js');
const S = require('../Study Flow/js/storage.js');
const NOW = '2026-11-04T08:00:00-05:00';
const dt = time => `2026-11-04T${time}:00-05:00`;
const task = (id, minutes = 180, deadline = dt('17:00'), completed = 0, status = 'todo') =>
  ({id, name: `Task ${id}`, minutes, completed, status, deadline});
const profile = (tasks = [task('a')], windows = [['09:00', '12:00']], commitments = []) =>
  ({tasks, availability: {0: [], 1: [], 2: [], 3: windows, 4: [], 5: [], 6: []}, commitments});
const plan = (data, controls = {}) => P.generateFeasibleStudyPlan(data, {now: NOW, ...controls});
const sum = blocks => blocks.reduce((total, block) => total + block.duration, 0);
const storage = () => {
  const values = new Map();
  return {getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value)};
};

function boot(store = storage()) {
  const root = path.join(__dirname, '..', 'Study Flow');
  const html = fs.readFileSync(path.join(root, 'studyflow_demo.html'), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  const elements = new Map(ids.map(id => [id, {value: '', innerHTML: '', textContent: '', disabled: false,
    dataset: {}, style: {setProperty() {}}, classList: {add() {}, remove() {}, toggle() {}},
    querySelectorAll: () => [], focus() {}, click() {}}]));
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [NOW])); }
    static now() { return +new Date(NOW); }
  }
  let latestPlan = null;
  const context = vm.createContext({Date: Clock, Intl, console, localStorage: store,
    document: {getElementById: id => {
      assert.ok(elements.has(id), `HTML missing #${id}`);
      return elements.get(id);
    }, querySelectorAll: () => [], body: {}, addEventListener() {}, activeElement: {tagName: 'BODY'}},
    setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {}, confirm: () => true});
  context.window = context;
  for (const file of ['planning.js', 'storage.js', 'app.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'js', file), 'utf8'), context, {filename: file});
    if (file === 'planning.js') {
      // Observe the actual result consumed by app.js; do not substitute another planner.
      const real = context.StudyFlowPlanning;
      context.StudyFlowPlanning = {...real, generateFeasibleStudyPlan(...args) {
        const result = real.generateFeasibleStudyPlan(...args);
        latestPlan = JSON.parse(JSON.stringify(result));
        return result;
      }};
    }
  }
  return {context, elements, store, getPlan: () => structuredClone(latestPlan)};
}

const cases = {
  test_SR_01_priority_fixed_scenarios() {
    // Expected ordering is fixed, not computed using the function under test.
    const fixtures = [
      [task('later', 60, dt('20:00')), task('sooner', 60, dt('12:00')), 'sooner'],
      [task('small', 30), task('large', 180), 'large'],
      [task('b', 60), task('a', 60), 'a'],
      [task('z', 60), task('A', 60), 'A'],
      [task('done', 60, dt('09:00'), 60, 'done'), task('open', 60), 'open'],
      [task('spent', 60, dt('09:00'), 60), task('open', 60), 'open'],
      [task('past', 60, dt('07:00')), task('future', 60), 'future'],
      [task('now', 60, dt('08:00')), task('future', 60), 'future'],
      [task('partial', 180, dt('17:00'), 170), task('new', 60), 'new'],
      [task('low', 60, dt('20:00')), {...task('high', 60, dt('20:00')), importance: 4}, 'high'],
      [task('late', 600, dt('20:00')), task('early', 600, dt('12:00')), 'early'],
      [task('partial', 300, dt('17:00'), 240), task('full', 90), 'full']
    ];
    for (const [a, b, expected] of fixtures)
      assert.equal(P.calculateTaskPriorities([a, b], NOW)[0].id, expected);
    assert.deepEqual(P.calculateTaskPriorities([], NOW), []);
  },
  test_1_4_3_remaining_work() {
    assert.equal(P.remaining(task('a', 180, dt('17:00'), 45)), 135);
    assert.equal(P.remaining(task('a', 180, dt('17:00'), 0, 'done')), 0);
  },
  test_CR_01_constraints_validation() {
    for (const bad of [profile([task('a', -1)]), profile([task('a'), task('a')]),
      profile([task('a', 60, 'not-a-date')]), profile([task('a', 60, dt('17:00'), 75)]),
      profile([task('a')], [['12:00', '09:00']]), profile([task('a')], [['99:00', '12:00']])])
      assert.throws(() => plan(bad), TypeError);
  },
  test_CR_02_commitments_and_overlap_normalization() {
    const data = profile([task('a')], [['09:00', '12:00'], ['10:00', '13:00']],
      [{start: dt('10:00'), end: dt('11:00')}]);
    const slots = P.determineAvailableStudySlots(P.identifySchedulingConstraints(data, {now: NOW}));
    assert.deepEqual(slots.map(slot => [slot.start.toISOString(), slot.end.toISOString()]),
      [[new Date(dt('09:00')).toISOString(), new Date(dt('10:00')).toISOString()],
       [new Date(dt('11:00')).toISOString(), new Date(dt('13:00')).toISOString()]]);
  },
  test_CR_03_long_window_multiple_sessions() {
    const result = plan(profile());
    assert.deepEqual(result.blocks.map(block => block.duration), [90, 90]);
    assert.equal(result.blocks[0].start.toISOString(), new Date(dt('09:00')).toISOString());
    assert.equal(result.blocks[1].end.toISOString(), new Date(dt('12:00')).toISOString());
    assert.deepEqual(result.shortfalls, []);
  },
  test_CR_04_detect_invalid_proposal() {
    const c = P.identifySchedulingConstraints(profile(), {now: NOW});
    const slots = P.determineAvailableStudySlots(c);
    const proposal = {blocks: [{taskId: 'a', start: new Date(dt('07:00')), end: new Date(dt('10:00')), duration: 180}], shortfalls: []};
    const assessment = P.evaluateScheduleFeasibility(proposal, c, slots);
    assert.equal(assessment.valid, false);
    assert.ok(assessment.issues.some(issue => issue.includes('time boundary')));
    assert.throws(() => P.assembleStudyPlan(proposal, assessment));
    const overlap = {blocks: [
      {taskId: 'a', start: new Date(dt('09:00')), end: new Date(dt('10:30')), duration: 90},
      {taskId: 'a', start: new Date(dt('10:00')), end: new Date(dt('11:30')), duration: 90}], shortfalls: []};
    assert.ok(P.evaluateScheduleFeasibility(overlap, c, slots).issues.some(issue => issue.includes('overlapping session')));
  },
  test_SR_02_deadline_capacity_and_no_overlap() {
    const result = plan(profile([task('a', 150, dt('12:00')), task('b', 120, dt('14:00'))],
      [['09:00', '12:00'], ['13:00', '14:00']], [{start: dt('09:30'), end: dt('10:00')}]));
    assert.equal(sum(result.blocks), 210);
    assert.deepEqual(result.shortfalls, [{taskId: 'b', name: 'Task b', minutes: 60}]);
    for (let i = 0; i < result.blocks.length; i++) {
      const block = result.blocks[i];
      assert.ok(block.duration <= 90);
      assert.ok(block.start >= new Date(NOW));
      assert.ok(block.end <= new Date(dt(block.taskId === 'a' ? '12:00' : '14:00')));
      assert.ok(block.end <= new Date(dt('09:30')) || block.start >= new Date(dt('10:00')));
      if (i) assert.ok(block.start >= result.blocks[i - 1].end);
    }
  },
  test_SR_04_overdue_and_empty_availability() {
    const result = plan(profile([task('overdue', 90, dt('07:00')), task('future', 60)], []));
    assert.deepEqual(result.blocks, []);
    assert.equal(result.shortfalls.find(item => item.taskId === 'overdue').minutes, 90);
    assert.equal(result.shortfalls.find(item => item.taskId === 'future').minutes, 60);
  },
  test_CR_10_session_task_association() {
    const data = profile([task('original', 60)]), result = plan(data);
    assert.ok(result.blocks.length > 0);
    assert.ok(result.blocks.every(block => block.taskId === 'original'));
    assert.equal(JSON.stringify(data), JSON.stringify(profile([task('original', 60)])));
  },
  test_CR_12_repeatable_fixed_context() {
    const data = profile([task('a', 350), task('b', 120)]), before = JSON.stringify(data);
    assert.equal(JSON.stringify(plan(data)), JSON.stringify(plan(data)));
    assert.equal(JSON.stringify(data), before);
  },
  test_CR_13_no_external_service_or_storage() {
    const result = plan(profile());
    assert.equal(sum(result.blocks), 180);
    // Module imports succeeded without a window, document, fetch or localStorage.
    assert.equal(typeof P.generateFeasibleStudyPlan, 'function');
  },
  test_CR_17_active_profile_separation() {
    const alex = profile([task('alex-task', 60)]), maya = profile([task('maya-task', 90)]);
    assert.ok(plan(alex).blocks.every(block => block.taskId === 'alex-task'));
    assert.ok(plan(maya).blocks.every(block => block.taskId === 'maya-task'));
  },
  test_SR_06_storage_roundtrip_and_write_failure() {
    const store = storage(), value = {version: 4, active: 'alex', users: {alex: profile()}};
    S.saveState(store, value);
    assert.deepEqual(S.loadState(store, () => ({})), value);
    store.setItem(S.KEY, '{broken');
    assert.deepEqual(S.loadState(store, () => ({fallback: true})), {fallback: true});
    assert.throws(() => S.saveState({setItem() {throw new Error('quota exceeded');}}, value), /quota/);
  },
  test_SR_06_UI_reopen_and_invalid_saved_profile() {
    const store = storage();
    const saved = {version: 4, active: 'alex', tourSeen: true, users: {alex: {...profile([task('restored', 60)]), name: 'Alex'}}};
    store.setItem(S.KEY, JSON.stringify(saved));
    assert.match(boot(store).elements.get('taskRows').innerHTML, /Task restored/);
    store.setItem(S.KEY, JSON.stringify({users: {}, active: 'alex'}));
    assert.match(boot(store).elements.get('taskRows').innerHTML, /Binary Search Tree/);
  },
  test_CR_16_representative_planning_time() {
    const {performance} = require('node:perf_hooks');
    const data = profile(Array.from({length: 250}, (_, i) => task(`load-${i}`, 120)));
    const start = performance.now();
    const result = plan(data);
    const elapsedMilliseconds = performance.now() - start;
    assert.equal(sum(result.blocks) + result.shortfalls.reduce((n, item) => n + item.minutes, 0), 30000);
    assert.ok(elapsedMilliseconds < 3000, `250-task fixture took ${elapsedMilliseconds}ms`);
    return {elapsedMilliseconds, tasks: 250, scope: 'planning only; not end-to-end UI timing'};
  },
  test_CR_02_never_schedule_before_now() {
    const result = plan(profile([task('a', 60)], [['07:00', '10:00']]), {now: dt('09:00').replace(':00-05:00', ':30-05:00')});
    assert.ok(result.blocks[0].start >= new Date('2026-11-04T09:00:30-05:00'));
    assert.equal(result.blocks[0].start.getMinutes(), 1);
  },
  test_SR_03_what_if_preview_matches_applied_window() {
    const data = profile([task('a', 120)], []), applied = structuredClone(data);
    for (let day = 0; day < 7; day++) applied.availability[day] = [['20:30', '21:30']];
    assert.equal(JSON.stringify(plan(data, {extraMinutes: 60})), JSON.stringify(plan(applied)));
  },
  test_CR_02_dst_local_calendar_days() {
    const data = profile([task('a', 180, '2026-11-01T04:00:00-05:00')]);
    data.availability = {0: [['01:00', '03:00']]};
    const result = plan(data, {now: '2026-11-01T00:00:00-04:00'});
    assert.equal(sum(result.blocks), 180);
    assert.deepEqual(result.shortfalls, []);
  },
  test_SR_03_UI_boot_save_edit_replan() {
    const {elements, store} = boot();
    const set = (id, value) => {elements.get(id).value = value;};
    set('taskId', ''); set('taskName', 'Recorded demo task'); set('taskDeadline', '2026-11-06T17:00');
    set('taskMinutes', '60'); set('taskCompleted', '0'); set('taskStatus', 'todo');
    set('taskImportance', '2'); set('taskEnergy', 'medium'); set('taskDifficulty', '2');
    elements.get('taskForm').onsubmit({preventDefault() {}});
    const saved = JSON.parse(store.getItem(S.KEY));
    assert.equal(saved.users.alex.tasks.at(-1).name, 'Recorded demo task');
    assert.match(elements.get('taskRows').innerHTML, /Recorded demo task/);
    assert.match(elements.get('toast').textContent, /Task saved/);
    const id = saved.users.alex.tasks.at(-1).id;
    set('taskId', id); set('taskName', 'Updated demo task'); set('taskCompleted', '15');
    elements.get('taskForm').onsubmit({preventDefault() {}});
    assert.equal(JSON.parse(store.getItem(S.KEY)).users.alex.tasks.at(-1).completed, 15);
    assert.match(elements.get('taskRows').innerHTML, /Updated demo task/);
  },
  test_SR_03_UI_failed_save_rolls_back() {
    const {elements, store} = boot();
    store.setItem = () => {throw new Error('quota exceeded');};
    const inputs = {taskId: '', taskName: 'Must not persist', taskDeadline: '2026-11-06T17:00',
      taskMinutes: '60', taskCompleted: '0', taskStatus: 'todo', taskImportance: '2', taskEnergy: 'medium', taskDifficulty: '2'};
    for (const [id, value] of Object.entries(inputs)) elements.get(id).value = value;
    elements.get('taskForm').onsubmit({preventDefault() {}});
    assert.match(elements.get('toast').textContent, /not saved/);
    assert.doesNotMatch(elements.get('taskRows').innerHTML, /Must not persist/);
  },
  test_SR_07_UI_switch_keeps_profile_data_separate() {
    const {elements} = boot();
    assert.match(elements.get('taskRows').innerHTML, /Binary Search Tree/);
    elements.get('userSelect').onchange({target: {value: 'maya'}});
    assert.match(elements.get('taskRows').innerHTML, /Heat Exchanger/);
    assert.doesNotMatch(elements.get('taskRows').innerHTML, /Binary Search Tree/);
    assert.doesNotMatch(elements.get('reqGrid').innerHTML, /VERIFIED/);
  }
};


// Independent fixture expectations. These are test cases, not new model IDs.
function planningFixtures() {
  const f = (name, data, expected, controls = {}) => ({name, data, expected, controls});
  const block = (start, duration, date = '2026-11-04') => ({taskId: 'a',
    start: `${date}T${start}:00-05:00`, duration});
  return [
    f('one_hour', profile([task('a', 60)]), [block('09:00', 60)]),
    f('long_work', profile([task('a', 180)]), [block('09:00', 90), block('10:30', 90)]),
    f('part_completed', profile([task('a', 180, dt('17:00'), 60)]), [block('09:00', 90), block('10:30', 30)]),
    f('completed_task', profile([task('a', 60, dt('17:00'), 60, 'done')]), []),
    f('no_tasks', profile([]), []),
    f('custom_session_limit', profile([task('a', 75)]), [block('09:00', 30), block('09:30', 30), block('10:00', 15)], {maxSessionMinutes: 30}),
    f('fixed_commitment', profile([task('a', 120)], [['09:00','12:00']], [{start:dt('10:00'),end:dt('11:00')}]), [block('09:00',60),block('11:00',60)]),
    f('overlapping_windows', profile([task('a', 240)], [['09:00','12:00'],['10:00','13:00']]), [block('09:00',90),block('10:30',90),block('12:00',60)]),
    f('deadline_boundary', profile([task('a', 90, dt('10:30'))]), [block('09:00',90)]),
    f('clip_current_time', profile([task('a', 120)]), [block('09:30',90),block('11:00',30)], {now:dt('09:30')}),
    f('adjacent_windows', profile([task('a',120)], [['09:00','10:00'],['10:00','11:00']]), [block('09:00',90),block('10:30',30)]),
    f('next_local_day', {tasks:[task('a',60,'2026-11-05T17:00:00-05:00')],availability:{4:[['09:00','10:00']]},commitments:[]}, [block('09:00',60,'2026-11-05')])
  ];
}
function checkExpected(fixture, result) {
  assert.deepEqual(result.blocks.map(b => ({taskId:b.taskId,start:new Date(b.start).toISOString(),duration:b.duration})),
    fixture.expected.map(b => ({...b,start:new Date(b.start).toISOString()})), fixture.name);
  assert.deepEqual(result.shortfalls, [], fixture.name);
  for (const b of result.blocks) {
    assert.equal(+new Date(b.end)-+new Date(b.start), b.duration*60000);
    assert.ok(new Date(b.end)<=new Date(fixture.data.tasks.find(t=>t.id===b.taskId).deadline));
  }
}
function savedHarness(data=profile([task('a',120)])) {
  const store=storage();
  store.setItem(S.KEY,JSON.stringify({version:4,active:'alex',tourSeen:true,users:{alex:{name:'Alex',...data}}}));
  return boot(store);
}
function submitTask(h, changes={}) {
  const inputs={taskId:'a',taskName:'Task a',taskDeadline:'2026-11-04T17:00',taskMinutes:'120',taskCompleted:'0',taskStatus:'todo',taskImportance:'2',taskEnergy:'medium',taskDifficulty:'2',...changes};
  for(const [id,value] of Object.entries(inputs)) h.elements.get(id).value=value;
  h.elements.get('taskForm').onsubmit({preventDefault(){}});
  assert.match(h.elements.get('toast').textContent,/Task saved/);
}
function workload(h,scheduled,shortfall) {
  const p=h.getPlan();assert.equal(sum(p.blocks),scheduled);
  assert.equal(p.shortfalls.reduce((n,s)=>n+s.minutes,0),shortfall);
  return p;
}
Object.assign(cases, {
  test_SR_02_twelve_feasible_scenarios() {
    const names=[];
    for(const f of planningFixtures()){checkExpected(f,plan(f.data,f.controls));names.push(f.name);}
    assert.equal(names.length,12);return {scenarioCount:12,scenarioNames:names};
  },
  test_SR_08_CR_12_twelve_scenarios_three_runs() {
    const evidence=[];
    for(const f of planningFixtures()) {
      const before=JSON.stringify(f.data),results=[];
      for(let run=0;run<3;run++){const result=plan(f.data,f.controls);checkExpected(f,result);results.push(JSON.stringify(result));}
      assert.equal(new Set(results).size,1,f.name);assert.equal(JSON.stringify(f.data),before);
      evidence.push({scenario:f.name,runs:3,identical:true,expectedOutputMatched:true});
    }
    return {scenarioCount:12,runCount:36,ruleVersion:P.RULE_VERSION,timeZone:process.env.TZ,evidence};
  },
  test_SR_03_UI_creation_updates_schedule() {
    const h=savedHarness(profile([]));workload(h,0,0);
    submitTask(h,{taskId:'',taskName:'New task',taskMinutes:'60'});
    const p=workload(h,60,0),saved=JSON.parse(h.store.getItem(S.KEY));
    assert.equal(p.blocks[0].taskId,saved.users.alex.tasks[0].id);
    assert.match(h.elements.get('schedule').innerHTML,/New task/);
  },
  test_SR_03_UI_deadline_updates_schedule() {
    const h=savedHarness();workload(h,120,0);
    submitTask(h,{taskDeadline:'2026-11-04T10:00'});
    const p=workload(h,60,60);assert.ok(p.blocks.every(b=>new Date(b.end)<=new Date(dt('10:00'))));
    assert.match(h.elements.get('planAlert').innerHTML,/60 unscheduled minutes/);
  },
  test_SR_03_UI_workload_updates_schedule() {
    const h=savedHarness();workload(h,120,0);submitTask(h,{taskMinutes:'180'});workload(h,180,0);
  },
  test_SR_03_UI_completion_updates_schedule() {
    const h=savedHarness();workload(h,120,0);submitTask(h,{taskCompleted:'30'});workload(h,90,0);
    submitTask(h,{taskStatus:'done',taskCompleted:'120'});workload(h,0,0);
  },
  test_SR_03_UI_availability_updates_schedule() {
    const h=savedHarness(profile([task('a',120)],[]));workload(h,0,120);
    const add={dataset:{slotAdd:'3'},closest:selector=>selector==='.dayCard'?{querySelectorAll:()=>[{value:'09:00'},{value:'11:00'}]}:null};
    h.context.document.body.onclick({target:{closest:selector=>selector==='[data-slot-add]'?add:null}});
    const p=workload(h,120,0);assert.equal(p.blocks[0].start,new Date(dt('09:00')).toISOString());
    assert.deepEqual(JSON.parse(h.store.getItem(S.KEY)).users.alex.availability[3],[['09:00','11:00']]);
  },
  test_SR_04_three_shortfall_scenarios() {
    const fixtures=[
      {name:'insufficient_total_capacity',data:profile([task('a',240)]),scheduled:180,short:60},
      {name:'deadline_limited_capacity',data:profile([task('a',120,dt('10:00'))]),scheduled:60,short:60},
      {name:'overdue_unfinished',data:profile([task('a',90,dt('07:00'))]),scheduled:0,short:90}];
    for(const f of fixtures){const p=plan(f.data);assert.equal(sum(p.blocks),f.scheduled);assert.equal(p.shortfalls.length,1);assert.equal(p.shortfalls[0].taskId,'a');assert.equal(p.shortfalls[0].minutes,f.short);assert.equal(sum(p.blocks)+f.short,P.remaining(f.data.tasks[0]));}
    return {scenarioCount:3,names:fixtures.map(f=>f.name)};
  },
  test_CR_01_normalized_constraints_positive() {
    const data=profile([task('a',60)]),before=JSON.stringify(data);
    const c=P.identifySchedulingConstraints(data,{now:NOW,horizonDays:2,maxSessionMinutes:30});
    assert.equal(c.horizonDays,2);assert.equal(c.maxSessionMinutes,30);assert.equal(c.now.toISOString(),new Date(NOW).toISOString());
    assert.equal(c.horizonEnd.toISOString(),new Date('2026-11-06T00:00:00-05:00').toISOString());
    assert.equal(Object.keys(c.availability).length,7);assert.equal(c.ruleVersion,P.RULE_VERSION);
    c.tasks[0].name='Changed copy';c.availability[3][0][0]='08:00';assert.equal(JSON.stringify(data),before);
  },
  test_CR_05_valid_partial_plan_preserves_outputs() {
    const c=P.identifySchedulingConstraints(profile([task('a',240)]),{now:NOW});
    const slots=P.determineAvailableStudySlots(c),proposal=P.allocatePrioritizedTasks(P.calculateTaskPriorities(c.tasks,c.now),slots,c);
    const a=P.evaluateScheduleFeasibility(proposal,c,slots);assert.equal(a.valid,true);assert.equal(a.feasible,false);assert.equal(a.unscheduledMinutes,60);
    const p=P.assembleStudyPlan(proposal,a);assert.equal(p.blocks,proposal.blocks);assert.equal(p.shortfalls,proposal.shortfalls);assert.equal(sum(p.blocks),180);assert.equal(p.shortfalls[0].minutes,60);
  }
});

if (require.main === module) {
  const name = process.argv[2];
  if (!Object.hasOwn(cases, name)) throw new Error(`Unknown test: ${name}`);
  const measurements = cases[name]();
  console.log(JSON.stringify({name, status: 'passed', ...(measurements ? {measurements} : {})}));
}
module.exports = cases;
