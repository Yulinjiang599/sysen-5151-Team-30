# UC.3 supplied measurement materials

These two files were supplied by a team member and uploaded unchanged on 2026-11-12:

- `measure.py`: Playwright measurement script for baseline and alternative UC.3 scenarios.
- `measured_runs.csv`: supplied measurement table, containing 60 rows across the baseline and alternative scenarios.

## Provenance and validation

Upload validation was limited to Python syntax, readable CSV structure and byte-for-byte equality with the supplied attachments. The measurement script was not executed during upload; these data are not newly reproduced results or evidence that all requirements passed.

SHA-256:

- measure.py: `d79626e80ad6e27b7c8a70f2515680078d262e431231b0cc9bd2a4f386493fc4`
- measured_runs.csv: `2822b6e7d1ca6898ed3b6ca6f8370c655e98b197a6d310ecc0f3f3e3ccf3d246`

## Reproduction boundaries

The script requires Python Playwright, an instrumented HTML app exposing `window.__SF`, and the Chromium executable path hard-coded in `CHROME`. The instrumented input HTML was not included with these two attachments, so the current repository demo is not claimed to be directly compatible. Its first argument is the HTML app path; its second argument is an output path.

The script writes JSON records via `json.dump`, while the supplied results are CSV. The JSON-to-CSV conversion procedure was not supplied and the origin of the CSV has not been independently reproduced. The `replans` column is populated from a counter of `studyflow_demo_v3` storage writes; it is not direct instrumentation of planner invocations. Input dates depend on the host's current time, and a fixed random seed alone does not make different-date runs equivalent.

Retain these original files as provided; document the tested app revision, environment, measurement date and conversion procedure before making a reproducibility claim.
