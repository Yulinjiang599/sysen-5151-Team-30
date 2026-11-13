"""Measured behavior of StudyFlow (UC.3 Generate Study Plan) for baseline and alternative scenarios.
30 paired input sets; each set run once per scenario in a fresh browser context."""
import json, random, sys, statistics as st
from datetime import datetime, timedelta
from playwright.sync_api import sync_playwright

APP = sys.argv[1]
OUT = sys.argv[2]
N = 30
REPS = 25          # repeated invocations per stage -> per-invocation mean (timer resolution)
CHROME = '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'

INIT = """
window.__saves=0;
const _set=Storage.prototype.setItem;
Storage.prototype.setItem=function(k,v){if(k==='studyflow_demo_v3')window.__saves++;return _set.call(this,k,v)};
"""

def local(dt):
    return dt.strftime('%Y-%m-%dT%H:%M')

def inputs(i, rng):
    now = datetime.now().replace(second=0, microsecond=0)
    dl = (now + timedelta(days=rng.randint(1, 6))).replace(hour=rng.choice([12, 17, 21, 23]), minute=0)
    cs = (now + timedelta(days=rng.randint(1, 6))).replace(hour=rng.randint(9, 19), minute=rng.choice([0, 30]))
    ce = cs + timedelta(minutes=rng.choice([30, 60, 90, 120]))
    return dict(user='alex' if i % 2 == 0 else 'maya',
                name=f'Measured task {i+1:02d}', deadline=local(dl), minutes=rng.choice(range(60, 315, 15)),
                ctitle=f'Commitment {i+1:02d}', cstart=local(cs), cend=local(ce))

STAGES = r"""
async (REPS) => {
  const S=window.__SF, t=()=>performance.now(), m=(f)=>{const a=t();for(let i=0;i<REPS;i++)f();return (t()-a)/REPS};
  return {
    s36: m(()=>{S.slots(S.state);S.user().tasks.map(S.remaining)}),
    s37: m(()=>S.getRanked()),
    s38: m(()=>S.makePlan()),
    s39: m(()=>S.renderAll()),
    s312: m(()=>localStorage.setItem(S.KEY+'_probe',JSON.stringify(S.state))),
  };
}"""

CHECK = r"""
() => {
  const S=window.__SF,p=S.plan,u=S.user(),sl=S.slots(S.state);
  let overlap=0,outside=0,late=0;
  const b=[...p.blocks].sort((a,c)=>a.start-c.start);
  for(let i=1;i<b.length;i++) if(b[i].start<b[i-1].end) overlap++;
  for(const x of b){ if(!sl.some(s=>x.start>=s.start&&x.end<=s.end)) outside++;
    const tk=u.tasks.find(t=>t.id===x.taskId); if(tk&&x.end>new Date(tk.deadline)) late++; }
  return {blocks:b.length, scheduled:b.reduce((a,x)=>a+x.duration,0),
          shortfall:p.shortfalls.reduce((a,x)=>a+x.minutes,0), overlap, outside, late,
          sig: b.map(x=>x.name+'|'+(+x.start)+'|'+x.duration).join(';')+'#'+p.shortfalls.map(x=>x.name+x.minutes).join(';'),
          tasks:u.tasks.length};
}"""

def timed(page, js):
    return page.evaluate("(code)=>{const a=performance.now();(new Function(code))();return performance.now()-a}", js)

def fill_task(d):
    return f"""{{const $=id=>document.getElementById(id);$('taskName').value={json.dumps(d['name'])};
$('taskDeadline').value='{d['deadline']}';$('taskMinutes').value='{d['minutes']}';$('taskCompleted').value='0';}}"""

def fill_commit(d):
    return f"""{{const $=id=>document.getElementById(id);$('commitTitle').value={json.dumps(d['ctitle'])};
$('commitStart').value='{d['cstart']}';$('commitEnd').value='{d['cend']}';}}"""

def run(browser, d, scen):
    ctx = browser.new_context(viewport={'width': 1440, 'height': 900}, timezone_id='America/New_York')
    ctx.add_init_script(INIT)
    page = ctx.new_page()
    page.goto('file://' + APP)
    page.wait_for_function('window.__SF!==undefined')
    page.wait_for_timeout(450)
    page.evaluate("()=>{const g=document.getElementById('skipGuide');if(g&&document.getElementById('guideModal').classList.contains('open'))g.click()}")
    if d['user'] != 'alex':
        page.select_option('#userSelect', d['user'])
    page.evaluate("()=>{window.__saves=0}")
    r = {'scenario': scen, 'user': d['user']}
    page.evaluate("()=>window.__SF.showView('tasks')")            # UC.3.1 initiate
    if scen == 'baseline':
        r['uc32'] = timed(page, "document.getElementById('addTask').click()")          # request task info
        page.evaluate("(c)=>new Function(c)()", fill_task(d))                          # UC.3.3 (scripted student)
        r['submit_task'] = timed(page, "document.getElementById('taskForm').requestSubmit()")
        page.evaluate("()=>window.__SF.showView('availability')")
        r['uc34'] = timed(page, "document.getElementById('addCommit').click()")        # request availability
        page.evaluate("(c)=>new Function(c)()", fill_commit(d))                        # UC.3.5 (scripted student)
        r['submit_avail'] = timed(page, "document.getElementById('commitForm').requestSubmit()")
        r['uca1'] = 0.0
        r['input_processing'] = r['submit_task'] + r['submit_avail']
    else:
        # UC.3.2 Request Planning Information: both input groups presented together
        r['uc32'] = timed(page, "document.getElementById('addTask').click();document.getElementById('addCommit').click()")
        r['uc34'] = 0.0
        page.evaluate("(c)=>new Function(c)()", fill_task(d) + fill_commit(d))         # UC.3.3 combined entry
        r['uca1'] = page.evaluate("""()=>{const a=performance.now();let ok;for(let i=0;i<%d;i++){const $=id=>document.getElementById(id);
            ok=$('taskForm').checkValidity()&&$('commitForm').checkValidity()&&new Date($('commitEnd').value)>new Date($('commitStart').value);}
            window.__valid=ok;return (performance.now()-a)/%d}""" % (REPS, REPS))
        assert page.evaluate("()=>window.__valid")
        batch = f"""const S=window.__SF,$=id=>document.getElementById(id);
          const minutes=+$('taskMinutes').value;
          const task={{id:'t'+Date.now(),name:$('taskName').value.trim(),deadline:new Date($('taskDeadline').value).toISOString(),minutes,completed:0,status:'todo',importance:2,energy:'medium',difficulty:2}};
          const c={{id:'c'+Date.now(),title:$('commitTitle').value.trim(),start:new Date($('commitStart').value).toISOString(),end:new Date($('commitEnd').value).toISOString(),type:'Class'}};
          S.change(()=>{{S.user().tasks.push(task);S.user().commitments.push(c)}},'Planning inputs saved.');
          $('taskModal').classList.remove('open');$('commitModal').classList.remove('open');"""
        r['input_processing'] = timed(page, batch)
    page.evaluate("()=>window.__SF.showView('plan')")
    r['regenerate'] = timed(page, "document.getElementById('regenerate').click()")   # UC.3.6-3.9 via product button
    r['replans'] = page.evaluate("()=>window.__saves")
    r.update(page.evaluate(STAGES, REPS))
    r.update(page.evaluate(CHECK))
    r['system_total'] = r['uc32'] + r['uc34'] + r['uca1'] + r['input_processing'] + r['regenerate']
    ctx.close()
    return r

rng = random.Random(5151)
sets = [inputs(i, rng) for i in range(N)]
rows = []
with sync_playwright() as p:
    br = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
    for i, d in enumerate(sets):
        for scen in ('baseline', 'alternative'):
            r = run(br, d, scen); r['run'] = i + 1; r['inputs'] = d
            rows.append(r)
        print(i + 1, end=' ', flush=True)
    br.close()
json.dump(rows, open(OUT, 'w'), indent=1, default=str)
print('\nsaved', len(rows))
