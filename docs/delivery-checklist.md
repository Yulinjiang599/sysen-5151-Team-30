# D final handoff checklist

This is the reviewed Desktop handoff package for F.1.5. It is being prepared on an independent draft branch; it is not merged into main. Use this package's files and actual logs; do not substitute an older branch's CI result.

| D deliverable | File | Current status |
|---|---|---|
| Function → module → requirement → test traceability | [traceability.md](traceability.md), [traceability.json](traceability.json) | Five selected functions, native entity IDs, source/allocation checks and current code anchors present |
| Function IDs and module/function docstrings | [planning.js](../Study%20Flow/js/planning.js) | Five JSDoc blocks document actual parameters, return values, preconditions, exceptions and model differences |
| ICOM signatures | Same five JSDoc blocks; [contract](../contracts/api-v1.yaml) | Model arrows separated from implementation parameters; inherited controls named |
| Requirement-named tests | [Python entry](../tests/test_functional_requirements.py), [JS assertions](../tests/js_cases.cjs), [test mapping](test-requirement-map.md) | 31 local tests pass; 12 scenarios × 3 repeats and five saved-change categories included |
| CI | [verify.yml](../.github/workflows/verify.yml), [runner](../scripts/verify.py) | Configuration prepared and equivalent local checks pass; actual remote run for this package PENDING |
| Interface contract | [api-v1.yaml](../contracts/api-v1.yaml) | Nine real local operations; no invented HTTP API; paths intentionally empty |
| Page/interaction table | [route-table.md](route-table.md) | Source/event paths and evidence scope distinguished |
| E recording preparation | [recording-guide-E.md](recording-guide-E.md) | Approximately three-minute walkthrough provided |
| Actual browser observation | [browser-smoke.md](browser-smoke.md) | One in-app browser session recorded; 11 screenshots; full acceptance remains incomplete |
| Reproducible package | README, scripts, model, tests, contracts, docs and app files | Relative links and native model baseline included; no Desktop/Downloads dependency |

## Start and verify

From the extracted package root:

```sh
python3 scripts/verify.py
```

Requires Node.js 22+ and Python 3.12+. Actual local environment is recorded in `evidence/ci-summary.json`; the configured CI environment differs and still needs a real run. Local logs and outputs are in `evidence/verification.log` and `build/StudyFlow-3.0-fixed-standalone.html`.

For the demo open `Study Flow/studyflow_demo.html`, or the generated standalone HTML. For a consistent local origin use:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory 'Study Flow'
```

Then open http://127.0.0.1:8000/studyflow_demo.html. Local browser smoke-test data from port 8765 is not embedded in the source or exported into the package. Seed dates are relative to the first-use clock; screenshot numbers will not necessarily reproduce on another date.

## Remaining required decision / evidence

1. To establish the requested remote CI success, the user must authorize uploading the reviewed files, then inspect the actual Actions result for that exact commit. Review the actual Actions result linked from the draft PR; do not infer success from configuration alone.
2. Team review remains required for raw-profile versus Prioritized Task Set boundary/CR-6, CR-14 acceptance and missing plan-confirmation behavior under 1.4.6.
3. Broader acceptance remains incomplete: second named/versioned browser, five independent recovery cases, native file import/export, What-if Apply, complete approved-rule/rationale coverage and student pilots as applicable.
4. The known duplicate C.2.5.1 New Asset 281615 is excluded from traceability; allocated component 281610 is used. Do not remove model entities without the model owner's review.

These are open items, not invented requirements or evidence that D has already satisfied every criterion.
