# Verification evidence and scope

Run the repeatable checks from the repository root:

```sh
python3 scripts/check_traceability.py
python3 -m unittest discover -s tests -v
python3 scripts/build_standalone.py
```

Node.js 22+ runs the actual JavaScript planning/storage modules and the browser event-handler harness. Python 3.12+ supplies the standard-library unittest runner. No pip/npm application dependencies are required. The student-facing browser demo requires neither developer runtime.

## Evidence types

- **Planning unit/integration fixtures:** independent expected rankings, exact scheduled/unscheduled workload, fixed commitments, overlapping availability, deadline and session boundaries, overdue tasks, stable context and daylight-saving transition.
- **Negative assessment fixtures:** reject invalid proposals, overlapping sessions and invalid input records.
- **Storage/interaction harness:** save/edit/replan, failed-write rollback, data restoration and profile switching. It exercises real event handlers with a small DOM double; it does not verify rendered layout or native file dialogs.
- **Performance fixture:** planning 250 tasks with a 3-second bound. Reports planning-only duration; no inference about end-to-end UI timing or all possible input sizes.
- **Repository consistency:** machine-readable function links, real symbols, line anchors, test identifiers, HTML script references and local-interface contracts.
- **CI:** [.github/workflows/verify.yml](../.github/workflows/verify.yml) executes the same checks on pushes and pull requests. Inspect the actual Actions run for the current commit; configuration alone is not passing CI evidence.

## Manual browser check

Open `Study Flow/studyflow_demo.html` with its adjacent `js/` folder, or the generated single-file `build/StudyFlow-3.0-fixed-standalone.html`. For stable browser storage, the optional static server is:

```sh
python3 -m http.server 8000 --directory 'Study Flow'
```

Open `http://localhost:8000/studyflow_demo.html`. Check initial rendering; skip or finish the tour; visit Tasks, Availability, Generated plan and Requirements; add/edit a future task; switch profiles; reload to check restoration. Use the plan's Agenda view to read the full block names. Test JSON import/export through the browser if using that feature in the recording. The static server does not implement any application API.

## Material limits

CR-15 optional external calendar transport is deferred. CR-14 is represented by project scope/traceability documentation, without a runtime requirements-management input. Active profile filtering supports the planner's data-separation behavior but does not establish authenticated privacy. Timed user pilots and complete SR/AC acceptance are not replaced by unit tests. Historical SPEC.md targets remain proposals until team approval.

## Recorded local check — 2026-11-06

- Source/link/contract checker: passed, 11 function mappings, 18 CR rows, 21 test identifiers and nine local operations.
- Requirement test suite: 21 tests passed, including 12 fixed ranking scenarios within the SR-01 test.
- Representative CR-16 planning fixture: 250 tasks, approximately 2.4 ms on this local run; the asserted bound is 3000 ms. This observation is not an end-to-end or user-pilot result.
- Portable HTML build: completed from the same three source modules.
- Native browser smoke check: not completed; browser automation was interrupted. The real event handlers were exercised by the automated DOM harness. Perform the manual sequence above before recording.

The current remote CI result is shown in the pull request / GitHub Actions, rather than copied into a static document that may become stale after another commit.
