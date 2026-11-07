# StudyFlow D working package

This directory contains the D handoff package reconstructed from the reviewed Desktop working copy. Application behavior is preserved from the reference code; five planning JSDoc blocks and verification/documentation materials have been revised.

## Start here

- [Final handoff checklist and open items](docs/delivery-checklist.md)
- [Selected-function traceability](docs/traceability.md)
- [Requirement test mapping](docs/test-requirement-map.md)
- [Local operation contract](contracts/api-v1.yaml)
- [Views and interactions](docs/route-table.md)
- [Verification scope](docs/verification.md)
- [E recording walkthrough](docs/recording-guide-E.md)

## Local verification

Requires Node.js 22+ and Python 3.12+ with no third-party packages:

```sh
python3 scripts/verify.py
```

The GitHub Actions workflow runs the same command for this branch. Use the Actions result for the exact commit being reviewed; local logs or an older branch run do not establish its remote result.

Open `Study Flow/studyflow_demo.html` to inspect the application, or the generated standalone HTML in `build/`. A single real browser smoke sequence is recorded in [docs/browser-smoke.md](docs/browser-smoke.md); complete browser acceptance remains pending. A stable local origin can be provided by `python3 -m http.server 8000 --directory 'Study Flow'`.
