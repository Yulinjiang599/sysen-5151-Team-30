# Model-to-code traceability

## Baseline and scope

The demonstration uses **F.1.5 Generate Feasible Study Plan**, decomposed into F.1.5.1–F.1.5.5, and the physical branch **C.2.5** with modules C.2.5.1–C.2.5.5. Function identifiers use `F.`; system requirements such as `1.4.5` are separate entities even when their names match.

Model source: [team report, Chapter 8–9](https://docs.google.com/document/d/1g_xE67P1cuqlw-m7l0tHZ-2sPa6xyJcMPPvPnlq-N5Q/edit?tab=t.sp76pwaocs5q), reviewed with model screenshots and RTM/RSM exports on 2026-10-30. The software input is the member-supplied `studyflow_demo 3.0.html`; its digest and repository base are in [source-baseline.json](source-baseline.json). Historical September/October XML exports are retained unchanged and are not evidence of the current Chapter 9 decomposition. This code update does not change the Innoslate model.

The implementation consolidates the five logical planning modules into named pure functions in one JavaScript file. The model-to-code allocation is therefore many functions to one source file, not five independently deployed services. The browser calls these exact functions. Python tests invoke the JavaScript through Node; there is no second Python scheduling algorithm.

## Function → code → requirements → tests

Every test identifier below is a method in [tests/test_functional_requirements.py](../tests/test_functional_requirements.py); the executable assertions are in [js_cases.cjs](../tests/js_cases.cjs). JSDoc comments record function IDs and ICOM roles in the source.

| Function ID | Model function | Module / symbol | Requirement IDs | Automated checks |
|---|---|---|---|---|
| F.1.1 | Receive and Maintain Academic Task Data | [change](../Study%20Flow/js/app.js#L42) | 1.4.1, SR-03, SR-06 | test_SR_03_UI_boot_save_edit_replan; test_SR_03_UI_failed_save_rolls_back; test_SR_06_UI_reopen_and_invalid_saved_profile |
| F.1.2 | Capture Study Availability | [renderAvailability](../Study%20Flow/js/app.js#L54) | 1.4.2, SR-02 | test_CR_02_commitments_and_overlap_normalization |
| F.1.3 | Analyze Deadlines and Workload | [remaining](../Study%20Flow/js/planning.js#L30) | 1.4.3, SR-01 | test_1_4_3_remaining_work |
| F.1.4 | Calculate Task Priorities | [calculateTaskPriorities](../Study%20Flow/js/planning.js#L60) | 1.4.4, SR-01, SR-08 | test_SR_01_priority_fixed_scenarios |
| F.1.5 | Generate Feasible Study Plan | [generateFeasibleStudyPlan](../Study%20Flow/js/planning.js#L227) | 1.4.5, SR-02, SR-04 | test_SR_02_deadline_capacity_and_no_overlap; test_SR_04_overdue_and_empty_availability |
| F.1.5.1 | Identify Scheduling Constraints | [identifySchedulingConstraints](../Study%20Flow/js/planning.js#L80) | 1.4.5, CR-1, CR-6 | test_CR_01_constraints_validation |
| F.1.5.2 | Determine Available Study Slots | [determineAvailableStudySlots](../Study%20Flow/js/planning.js#L135) | 1.4.5, CR-2 | test_CR_02_commitments_and_overlap_normalization; test_CR_02_never_schedule_before_now; test_CR_02_dst_local_calendar_days |
| F.1.5.3 | Allocate Prioritized Tasks | [allocatePrioritizedTasks](../Study%20Flow/js/planning.js#L159) | 1.4.5, CR-3 | test_CR_03_long_window_multiple_sessions; test_SR_02_deadline_capacity_and_no_overlap |
| F.1.5.4 | Evaluate Schedule Feasibility | [evaluateScheduleFeasibility](../Study%20Flow/js/planning.js#L192) | 1.4.5, CR-4 | test_CR_04_detect_invalid_proposal |
| F.1.5.5 | Generate Feasible Study Plan | [assembleStudyPlan](../Study%20Flow/js/planning.js#L220) | 1.4.5, CR-5, CR-7, CR-8, CR-10 | test_CR_10_session_task_association; test_SR_02_deadline_capacity_and_no_overlap |
| F.1.6 | Update and Present Study Plan | [persist](../Study%20Flow/js/app.js#L40) | 1.4.6, SR-03, SR-04 | test_SR_03_UI_boot_save_edit_replan; test_SR_03_UI_failed_save_rolls_back |

The F.1.2 row is supported by interval logic tests; the complete availability-entry user workflow still requires the manual demonstration. F.1.3 is represented by workload calculation and deadline filtering in the same planning module. A trace or unit-test pass is not proof of every system acceptance criterion.

## Component requirements → upper source → physical allocation

These are the established report/model relationship allocations, not relationships created by code. CR-9 has two sources, and CR-16 has two sources. CR-10 is plan-session-to-task association; CR-14 is development requirements/scope control.

| Component requirement | Traced from | Satisfied by (model) | Code / implementation | Evidence / limitation |
|---|---|---|---|---|
| CR-1 | 1.4.5 | C.2.5.1 | `identifySchedulingConstraints` | `test_CR_01_constraints_validation` — Automated constraint validation |
| CR-2 | 1.4.5 | C.2.5.2 | `determineAvailableStudySlots` | `test_CR_02_commitments_and_overlap_normalization` — Automated interval and commitment cases |
| CR-3 | 1.4.5 | C.2.5.3 | `allocatePrioritizedTasks` | `test_CR_03_long_window_multiple_sessions` — Automated multiple-session allocation |
| CR-4 | 1.4.5 | C.2.5.4 | `evaluateScheduleFeasibility` | `test_CR_04_detect_invalid_proposal` — Automated negative proposals |
| CR-5 | 1.4.5 | C.2.5.5 | `assembleStudyPlan` | `test_SR_02_deadline_capacity_and_no_overlap` — Automated end-to-end planning fixture |
| CR-6 | 1.4.5 | C.2.5 | `generateFeasibleStudyPlan` | `test_SR_02_deadline_capacity_and_no_overlap` — Receives active profile; ranks tasks inside orchestration |
| CR-7 | 1.4.5 | C.2.5 | `assembleStudyPlan` | `test_SR_02_deadline_capacity_and_no_overlap` — Provides plan data to presentation |
| CR-8 | 1.2.6 | C.2.5 | `assembleStudyPlan` | `test_CR_10_session_task_association` — blocks are internal calendar-update data; no external delivery |
| CR-9 | 1.1.6 + 2.3.2 | C.2.5 | `generateFeasibleStudyPlan` | `test_CR_12_repeatable_fixed_context` — Planning does not mutate input; storage restoration separately tested |
| CR-10 | 1.4.5 | C.2.5 | `assembleStudyPlan` | `test_CR_10_session_task_association` — taskId retained on sessions |
| CR-11 | 2.1.2 | C.2.5 | `generateFeasibleStudyPlan` | `test_CR_13_no_external_service_or_storage` — Core runs without UI or storage |
| CR-12 | 2.1.4 | C.2.5 | `generateFeasibleStudyPlan` | `test_CR_12_repeatable_fixed_context` — Identical time/context gives identical outputs |
| CR-13 | 2.3.4 | C.2.5 | `generateFeasibleStudyPlan` | `test_CR_13_no_external_service_or_storage` — Manual-input core needs no external service |
| CR-14 | 1.1.4 | C.2.5 | `Project scope/traceability records` | `scripts/check_traceability.py` — Project documentation control; no runtime requirements-management input is implemented |
| CR-15 | 1.3.9 | C.2.5 | `Deferred optional calendar transport` | `Not implemented` — Outside current MVP; internal blocks do not establish external delivery |
| CR-16 | 2.1.1 + 2.3.1 | C.2.5 | `generateFeasibleStudyPlan` | `test_CR_16_representative_planning_time` — 3-second planning target checked on 250-task fixture; not the 5-second UI or 5-minute usability acceptance |
| CR-17 | 2.1.3 | C.2.5 | `generateFeasibleStudyPlan` | `test_CR_17_active_profile_separation` — Profile output separation only; shared-origin demo has no authentication |
| CR-18 | 2.3.3 | C.2.5 | `Browser entry and planning module` | `Manual browser smoke check` — Runs in browser; Node/Python are developer test tools, not student installation requirements |

## Stakeholder acceptance evidence

| Need / requirement / acceptance | Implementation or evidence | Remaining boundary |
|---|---|---|
| N-01 / SR-01 / AC-01 | 12 independent fixed priority scenarios; dashboard rationale and task display | Timed student pilot not performed |
| N-02 / SR-02 / AC-02 | Session, commitment, deadline, overlap and workload-conservation fixtures | Does not claim optimal scheduling or all acceptance scenarios |
| N-03 / SR-03 / AC-03 | UI handler harness saves/edits and replans; failed-save rollback | Harness checks event wiring, not rendered browser layout or full timing |
| N-04 / SR-04 / AC-04 | Exact shortage and overdue-task fixtures; on-page notices | Shortfall describes this documented greedy policy |
| N-05 / SR-05 / AC-05 | Existing onboarding tour retained | First-time-user 5-minute pilot not performed |
| N-06 / SR-06 / AC-06 | JSON round-trip, UI reopen, invalid-state fallback and failed-write checks | Test adapter is in memory; browser persistence additionally needs manual reload check |
| N-07 / SR-07 / AC-07 | Active-profile output and UI-switch tests | Demo profiles share localStorage; authentication/authorization not implemented |
| N-08 / SR-08 / AC-08 | Explicit clock, fixed ranking and repeated-output tests | Human explanation/usability evidence not collected |
| N-09 / SR-09 / AC-09 | This matrix, machine-readable links and consistency checker | Team reviews model scope and source decisions |
| N-10 / SR-10 / AC-10 | Pure planning module and injected storage adapter; independent tests | Logical modules are co-located, not separately deployed services |

## ICOM and implementation policy

[ICOM signatures](icom-signatures.md) distinguish model arrows from code parameters. In particular, `profile` supplies boundary availability/commitments alongside the prioritized tasks. `constraints` is an explicit code context; model controls such as preserved data and scope are implemented partly as architectural/project practices rather than fabricated runtime messages.

The uploaded demo's ranking policy is retained: urgency weight 0.62 and pressure weight 0.38. Ties use deadline, remaining minutes, then lexical task ID. Importance/energy/difficulty are stored UI attributes but are not ranking factors. The planning horizon covers today and six following local calendar dates; the default maximum session is 90 minutes. These are implementation policy values, not newly approved course requirements.

Overlapping availability is merged; fixed commitments are subtracted; scheduling starts no earlier than the next whole minute. The planner repeatedly uses each slot until work or time is exhausted. Unfinished overdue tasks remain visible as shortfalls. Calendar updates are the generated `blocks` consumed by the internal calendar view. Optional Calendar/LMS/LLM transports are not implemented.

## Reproduce and inspect

```sh
python3 scripts/check_traceability.py
python3 -m unittest discover -s tests -v
python3 scripts/build_standalone.py
```

The [CI workflow](../.github/workflows/verify.yml) performs the same checks on pushes and pull requests. A workflow file alone is not a green run: open the actual run linked from the pull request. See [E's recording guide](recording-guide-E.md) for the demonstration sequence and [verification evidence](verification.md) for the checked scope.
