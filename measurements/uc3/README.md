# UC.3 measurement materials (Chapter 10, Sections 10.5–10.6)

Measured behavior of the StudyFlow demo for the two UC.3 Generate Study Plan scenarios
(baseline: separate task and availability entry; alternative: combined entry plus UC.3.A1 validation).
30 paired input sets, one run per scenario each, 60 runs in total. Student actions are entered by the
script and are **not** timed; only system processing is measured.

## Files

| File | Purpose |
|---|---|
| `measure.py` | Playwright test script. Loads the unchanged demo, runs both scenarios, records per-stage timings (ms) and plan checks. Writes JSON. |
| `studyflow_demo_3.0.html` | The exact demo revision that was tested, unchanged (team file "studyflow_demo 3.0"). `Study Flow/studyflow_demo.html` in this repository is an earlier revision (storage key `studyflow_demo_v2`) and is not the tested file. |
| `measured_runs.json` | Raw output of the 60 recorded runs, including each run's generated inputs, task count, and plan signature. |
| `to_csv.py` | Rebuilds `measured_runs.csv` byte-for-byte from the JSON and writes `measured_runs_extended.csv`. |
| `measured_runs.csv` | Original 60-row table (first uploaded 2026-11-12; unchanged). |
| `measured_runs_extended.csv` | Same runs at full precision plus `tasks` and `sig` (plan signature). |
| `figure_10_5.py` | Generates Figure 10-5 from the Table 10-1 distributions (100,000 draws per scenario, seeds 5151 and 99). |
| `sensitivity_q2.py` | Section 10.5.2 Q2: exponential vs. lognormal student-action distributions. |

## How the demo is measured without modifying it

The demo's functions are private to one JavaScript closure. At load time `measure.py` inserts one
read-only line into the page **in memory**, just before the closure ends:

```js
window.__SF={get state(){return state},user,remaining,slots,getRanked,makePlan,totals,renderAll,persist,change,recalculate,showView,KEY,get plan(){return plan}};
```

Nothing is written to disk, and no planning, ranking, or storage code is changed. The recorded runs used
the same line.

## Reproduce

```
pip install playwright numpy matplotlib && playwright install chromium
python measure.py studyflow_demo_3.0.html rerun.json        # 60 runs, about 1 minute
python to_csv.py measured_runs.json                           # rebuilds both CSV files
python figure_10_5.py                                         # writes fig10_5.png
python sensitivity_q2.py
```

Optional: set `SF_CHROME` to use a specific Chromium executable.

Input dates are generated from seed 5151 relative to the current date, so a re-run gives equivalent but
not identical inputs, and absolute timings depend on the machine. The recorded inputs are stored in
`measured_runs.json`.

## Provenance

- Recorded runs: 2026-11-10, headless Chromium (Chrome for Testing 153) via Playwright 1.63, Python 3.13, one Linux machine. Timings are synchronous JavaScript execution time and exclude browser painting.
- `measured_runs.csv` and the earlier `measure.py` were uploaded on 2026-11-12. The CSV is unchanged. The earlier `measure.py` (SHA-256 `d79626e8…3fc4`, kept in Git history) loaded a saved copy of the demo containing the same hook line; the current version adds the line in memory instead.
- `to_csv.py` reproduces the original CSV exactly. In that CSV, `uc32`, `uc34`, `input_processing`, and `regenerate` are rounded to 0.1 ms, stage probes to 0.001 ms, and `system_total` is the sum of the rounded per-session parts.
- Re-run check, 2026-11-14: a full 60-run re-run with the current `measure.py` reproduced the same qualitative results: identical plan signatures in 30 of 30 pairs, zero overlapping, out-of-availability, or late sessions, 2 recalculations per baseline session and 1 per alternative session, and 5 tasks per run.
- `replans` counts writes to the `studyflow_demo_v3` storage key. In this demo every save calls `persist()`, which writes to storage and then calls `recalculate()` and `renderAll()`, so the count equals the number of recalculations triggered by saved inputs.

## Evidence limits

These are processing-time proxies on one machine with five-task workloads. They do not measure human
entry time, and they do not by themselves verify requirement 2.3.1 or CR-16 (see report Section 10.7.2,
Table 10-B).

## SHA-256

| File | SHA-256 |
|---|---|
| measure.py | `61fa7d4dd5fa68cd45368b626968e12cd022b6758c134f95734fbfbd5962c6fc` |
| studyflow_demo_3.0.html | `602fc442afaa50fe51a8b269a2dcb444b78c39dc1727959f12efa02526d50474` |
| measured_runs.json | `ccd374acfc778109a9fe32e0dd9239adb3ea5ff8eab88eb2c4029de29a0334de` |
| to_csv.py | `744da6250645412e792982d0500ed5eeca7a02e52667954a66586fe104ba2224` |
| measured_runs.csv | `2822b6e7d1ca6898ed3b6ca6f8370c655e98b197a6d310ecc0f3f3e3ccf3d246` |
| measured_runs_extended.csv | `da51aae96c5bec766b15879a6709fd465df30a146d337a42eb62a3ccb8a791cb` |
| figure_10_5.py | `58ae8bafe5571b5c7bd8453603522a9cd13a71149f323dc56be5ce70ed39cd0f` |
| sensitivity_q2.py | `5721142b573489c6b1501d9456b56f70c5c4609406d1326a89aa8efe7a4f04ca` |
