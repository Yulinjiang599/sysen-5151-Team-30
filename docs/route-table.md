# Route and interaction table

## Transport boundary

StudyFlow 3.0 is a browser application. It loads one HTML document and three local JavaScript files. It has **no implemented HTTP API endpoints**, backend database, login route, LMS transport, external Calendar transport or LLM transport. Serving the files with Python only provides static files; it does not create an application API.

[contracts/api-v1.yaml](../contracts/api-v1.yaml) therefore uses an empty OpenAPI `paths` object and explicit `x-local-operations` for the implemented in-process interfaces. Proposed HTTP routes must be added only when actual handlers exist.

## Document baseline and evidence

Working-copy documentation for code commit `1070d48`. Five planning-function comments were expanded without changing executable code. Function and component identities were checked against [the supplied XML](../model/StudyFlow-baseline.xml). UI-to-model references below are implementation contributions; the XML is not claimed to contain browser-handler links.

Evidence combines 31 local unittest cases, local interface checks and one rendered-browser smoke session. See [test mapping](test-requirement-map.md) and [browser observations](browser-smoke.md). No remote CI result or complete browser acceptance is established.

## Static entry and views

| Entry / view | Location or DOM target | Handler | Model linkage |
|---|---|---|---|
| Application | `Study Flow/studyflow_demo.html` | loads `js/planning.js`, `js/storage.js`, `js/app.js` in order | F.1.1–F.1.6 |
| Dashboard | `#dashboard` | `showView('dashboard')`, `renderDashboard()` | F.1.4, F.1.6 / SR-01 |
| Tasks | `#tasks` | `showView('tasks')`, `renderTasks()` | F.1.1 / 1.4.1 |
| Availability | `#availability` | `showView('availability')`, `renderAvailability()` | F.1.2 / 1.4.2 |
| Generated plan | `#plan` | `showView('plan')`, `renderPlan()` | F.1.5, F.1.6 / 1.4.5, 1.4.6 |
| Requirements | `#requirements` | `showView('requirements')`, `renderReqs()` | SR-09; implementation mapping only |

The `#...` entries identify DOM sections, not separate HTTP resources or a hash router. The navigation buttons call `showView` and toggle active classes.

## F.1.5 local call path

`makePlan(state, extra, now)` in [app.js](../Study%20Flow/js/app.js) selects `state.users[state.active]` and calls `generateFeasibleStudyPlan(profile, controls)` in [planning.js](../Study%20Flow/js/planning.js).

| Function | Local operation | Main payload/result | Existing core evidence |
|---|---|---|---|
| F.1.5.1 / CR-1 | identifySchedulingConstraints | profile + controls → constraints | test_CR_01_constraints_validation (negative data) |
| F.1.5.2 / CR-2 | determineAvailableStudySlots | constraints → intervals | test_CR_02_commitments_and_overlap_normalization |
| F.1.5.3 / CR-3 | allocatePrioritizedTasks | ranked tasks + intervals + context → proposal | test_CR_03_long_window_multiple_sessions |
| F.1.5.4 / CR-4 | evaluateScheduleFeasibility | proposal + context + intervals → assessment | test_CR_04_detect_invalid_proposal |
| F.1.5.5 / CR-5 | assembleStudyPlan | proposal + assessment → blocks/shortfalls | integration output checks and invalid-assessment rejection |

The entry ranks tasks internally after constraint/slot preparation. XML expects Prioritized Task Set at F.1.5; CR-6 boundary review remains pending. Additional context parameters are code details, not invented IDEF0 arrows. A valid plan with shortfalls is returned; `feasible=false` alone does not cause rejection.

## Input and output interactions

Implementation paths below were inspected in source. “Core fixture” means logic-level evidence; it does not itself establish that the corresponding browser event was exercised. Native smoke observations below cover only the explicitly listed paths.

| Event / input | Implemented path in `js/app.js` | Output / state change | Evidence |
|---|---|---|---|
| Submit `#taskForm` | form handler → `change()` → `persist()` | validated active-profile task, saved JSON, fresh ranking/plan | Event harness covers five saved-change categories. Native smoke covers task creation/workload edit and changed shortage; other categories/timing remain pending |
| Availability Add window | delegated `data-slot-add` → `change()` | weekly availability, recalculated slots | Core interval/event fixtures plus native smoke Add window and invalid-window rejection passed; remove-window native check pending |
| Submit `#commitForm` | form handler → `change()` | commitment subtracted from study capacity | Core fixture: `test_CR_02_commitments_and_overlap_normalization`; commit-form submission not exercised |
| Edit/delete inputs | delegated handlers → `change()` | rollback on invalid input or save failure | Event harness checks failed task save; delegated delete and other failed-input paths remain pending |
| `#regenerate` | `recalculate()` → `renderAll()` | current-input plan without changing saved tasks | Core planning fixtures plus native Regenerate smoke: current schedule/240m shortage retained |
| `#userSelect` change | select active profile → `persist()` | only selected profile rendered/planned | Event harness and native Alex→Maya→Alex display check; not access-control acceptance |
| What-if inputs | `updateWhat()` → `makePlan(temp, extra)` | preview without saving | Core fixture `test_SR_03_what_if_preview_matches_applied_window` compares manually constructed profiles; preview UI event pending |
| What-if Apply | `applyWhat()` → `change()` | applies task/window edits and replans | Core window-agreement fixture only; actual applyWhat handler/native UI check pending |
| Export JSON | `exportData()` | downloadable state backup | Native export check pending; source exports both demonstration profiles |
| Import JSON | `importData()` → validate profiles → `persist()` | backs up confirmed state before applying valid input | Core validation/storage fixtures only; importData/file-dialog/backup flow check pending |
| Focus timer | `setTimerRun()`, `resetTimer()` | local timer state | Native timer check pending; retained demo extension; no claim that elapsed time updates task completed minutes |
| First-use tour | `openGuide()`, `renderGuide()` | walkthrough and persisted tour flag | Native first-use modal/Skip observed; full tour and timed usability pilot pending |

## Failure and evidence boundaries

- Task and commitment handlers normally call `change` → `persist`. `change` restores its snapshot on validation/save failure. Date conversion can fail before entering `change`; therefore a friendly error/rollback is not guaranteed for every malformed form value.
- `persist` validates/plans, writes storage and renders inside one try block. It reports false on failure; a render failure after a successful write is not an atomic storage rollback. Native UI failure paths require testing.
- Profile switching, undo and timer operations do not all use `change`. Avoid claiming that every operation shares the confirmed-input rollback guarantee.
- Some timer/tour paths write localStorage directly. Import/export, file dialogs and actual availability events remain pending browser validation.
- Working-copy UI-harness assertions live in [tests/js_cases.cjs](../tests/js_cases.cjs). See [test-requirement-map.md](test-requirement-map.md) for exact scope; remote CI for this package remains pending; the workflow configuration is provided.

## Persistence and authorization

Storage key: `studyflow_demo_v3`; pre-import backup key: `studyflow_demo_backup_v5`. Data uses `todo`, `progress`, `done`, weekly weekday keys `0`–`6` and local `HH:mm` availability. These are the actual demo field names, while the older specification's proposed field names remain a historical design proposal.

Alex/Maya are demonstration profiles sharing the browser origin. Switching profiles separates displayed/planned outputs; it does not restrict someone with access to the browser or exported backup from inspecting both profiles. Do not present these selectors as authentication or complete privacy acceptance evidence.

## Plan confirmation gap

Report Table 8-4(a), requirement 1.4.6, requires confirmation associated with the relevant plan. No explicit student-confirm-plan event or corresponding plan association was found. Task-form saves and deletion confirmation dialogs do not implement that behavior. F.1.6 remains partially implemented; the scope/implementation decision is pending team review. No route or handler is invented for it here.

## Rendered-browser evidence summary

A single in-app browser smoke sequence has now exercised task creation, workload edit, adding an availability window, rejecting an invalid window, regeneration, profile selection, calendar/agenda views, refresh and tab close/reopen. See [browser-smoke.md](browser-smoke.md) for screenshots, exact results and limits. It does not cover native delete/completion/deadline changes, What-if Apply, import/export dialogs, timing or access control.
