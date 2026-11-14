"""Convert measure.py JSON output to CSV.

python to_csv.py measured_runs.json
  -> measured_runs.csv           the original 60-row table (same columns and rounding as first supplied:
                                 times in ms, uc32/uc34/input_processing/regenerate to 0.1, stage probes
                                 to 0.001, system_total = sum of the rounded per-session parts)
  -> measured_runs_extended.csv  full-precision values plus task count (tasks) and plan signature (sig)
"""
import csv, json, sys

rows = json.load(open(sys.argv[1]))
BASE = ['run', 'scenario', 'user', 'uc32', 'uc34', 'uca1', 'input_processing', 'regenerate', 's36', 's37', 's38',
        's39', 's312', 'system_total', 'replans', 'blocks', 'scheduled', 'shortfall', 'overlap', 'outside', 'late',
        'task_deadline', 'task_minutes', 'commit_start', 'commit_end']
R1 = ['uc32', 'uc34', 'input_processing', 'regenerate']
R3 = ['uca1', 's36', 's37', 's38', 's39', 's312']


def flat(r):
    d = r['inputs']
    return {**r, 'task_deadline': d['deadline'], 'task_minutes': d['minutes'],
            'commit_start': d['cstart'], 'commit_end': d['cend']}


with open('measured_runs.csv', 'w', newline='') as f:
    w = csv.writer(f); w.writerow(BASE)   # csv default line ending (\r\n), as in the original file
    for r in rows:
        y = flat(r)
        for c in R1: y[c] = round(r[c], 1)
        for c in R3: y[c] = round(r[c], 3)
        y['system_total'] = round(y['uc32'] + y['uc34'] + y['uca1'] + y['input_processing'] + y['regenerate'], 3)
        w.writerow([y[c] for c in BASE])

EXT = BASE[:21] + ['tasks'] + BASE[21:] + ['sig']
with open('measured_runs_extended.csv', 'w', newline='') as f:
    w = csv.writer(f, lineterminator='\n'); w.writerow(EXT)
    for r in rows:
        y = flat(r); w.writerow([y[c] for c in EXT])
print('wrote measured_runs.csv and measured_runs_extended.csv,', len(rows), 'rows each')
