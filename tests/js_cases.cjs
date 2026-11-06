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
  const context = vm.createContext({Date: Clock, Intl, console, localStorage: store,
    document: {getElementById: id => {
      assert.ok(elements.has(id), `HTML missing #${id}`);
      return elements.get(id);
    }, querySelectorAll: () => [], body: {}, addEventListener() {}, activeElement: {tagName: 'BODY'}},
    setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {}, confirm: () => true});
  context.window = context;
  for (const file of ['planning.js', 'storage.js', 'app.js'])
    vm.runInContext(fs.readFileSync(path.join(root, 'js', file), 'utf8'), context, {filename: file});
  return {context, elements, store};
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

if (require.main === module) {
  const name = process.argv[2];
  if (!Object.hasOwn(cases, name)) throw new Error(`Unknown test: ${name}`);
  const measurements = cases[name]();
  console.log(JSON.stringify({name, status: 'passed', ...(measurements ? {measurements} : {})}));
}
module.exports = cases;
