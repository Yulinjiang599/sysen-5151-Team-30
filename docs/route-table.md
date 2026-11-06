# Route and interaction table

## Transport boundary

StudyFlow 3.0 is a browser application. It loads one HTML document and three local JavaScript files. It has **no implemented HTTP API endpoints**, backend database, login route, LMS transport, external Calendar transport or LLM transport. Serving the files with Python only provides static files; it does not create an application API.

[contracts/api-v1.yaml](../contracts/api-v1.yaml) therefore uses an empty OpenAPI `paths` object and explicit `x-local-operations` for the implemented in-process interfaces. Proposed HTTP routes must be added only when actual handlers exist.

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

## Input and output interactions

| Event / input | Implemented path in `js/app.js` | Output / state change | Evidence |
|---|---|---|---|
| Submit `#taskForm` | form handler → `change()` → `persist()` | validated active-profile task, saved JSON, fresh ranking/plan | `test_SR_03_UI_boot_save_edit_replan` |
| Availability Add window | delegated `data-slot-add` → `change()` | weekly availability, recalculated slots | core interval tests; manual entry check |
| Submit `#commitForm` | form handler → `change()` | commitment subtracted from study capacity | `test_CR_02_commitments_and_overlap_normalization` |
| Edit/delete inputs | delegated handlers → `change()` | rollback on invalid input or save failure | `test_SR_03_UI_failed_save_rolls_back` |
| `#regenerate` | `recalculate()` → `renderAll()` | current-input plan without changing saved tasks | planning and UI smoke checks |
| `#userSelect` change | select active profile → `persist()` | only selected profile rendered/planned | `test_SR_07_UI_switch_keeps_profile_data_separate` |
| What-if inputs | `updateWhat()` → `makePlan(temp, extra)` | preview without saving | `test_SR_03_what_if_preview_matches_applied_window` checks window agreement |
| What-if Apply | `applyWhat()` → `change()` | applies task/window edits and replans | same preview/applied window check; manual UI check |
| Export JSON | `exportData()` | downloadable state backup | manual check; exports both demonstration profiles |
| Import JSON | `importData()` → validate profiles → `persist()` | backs up confirmed state before applying valid input | validation/restore unit checks; manual file-dialog check |
| Focus timer | `setTimerRun()`, `resetTimer()` | local timer state | retained demo extension; no claim that elapsed time updates task completed minutes |
| First-use tour | `openGuide()`, `renderGuide()` | walkthrough and persisted tour flag | retained UI; timed usability pilot pending |

## Persistence and authorization

Storage key: `studyflow_demo_v3`; pre-import backup key: `studyflow_demo_backup_v5`. Data uses `todo`, `progress`, `done`, weekly weekday keys `0`–`6` and local `HH:mm` availability. These are the actual demo field names, while the older specification's proposed field names remain a historical design proposal.

Alex/Maya are demonstration profiles sharing the browser origin. Switching profiles separates displayed/planned outputs; it does not restrict someone with access to the browser or exported backup from inspecting both profiles. Do not present these selectors as authentication or complete privacy acceptance evidence.
