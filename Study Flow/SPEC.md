# StudyFlow — SPEC.md

- Team: SYSEN 5151 Project Team 30
- Version: 0.1 (draft for team review)
- Prepared: 2026-10-05
- Status: Source-aligned specification draft; implementation and test execution not verified.
- Language: English, consistent with the team report.
- Repository: [sysen-5151-Team-30](https://github.com/Yulinjiang599/sysen-5151-Team-30).
- Reviewed branch / commit: `main` / `26d5b899f8451a9c74e571b0bd25a4d7de76987e` (read-only inventory and README review, 2026-10-05).
- Approval: TBD — record reviewer, date, and approved version before acceptance.

## 1. Purpose, source, and scope

StudyFlow converts student-entered academic tasks, deadlines, remaining workload, and available study time into a prioritized study plan. This specification translates the current stakeholder needs and requirements into implementation contracts and acceptance checks.

Source: [SYSEN 5151 Team Product Description](https://docs.google.com/document/d/1g_xE67P1cuqlw-m7l0tHZ-2sPa6xyJcMPPvPnlq-N5Q/edit?tab=t.lvtgwng9yrex), Sections 2.5, 3.1–3.3 and 6.1, read on 2026-10-05. Model: [StudyFlow Stakeholder Requirements](https://cloud.innoslate.com/cornell/p/664/documents/249205). The report describes N-01–N-10 as its approved working baseline; this file does not independently certify that approval or implemented behavior.

In scope: manual task/availability entry, next-task recommendations, feasible sessions, replanning, shortfall reporting, initial-plan usability, saved-data restoration, privacy, reproducible rules, traceability, and independently testable components.

Repository evidence at the reviewed commit: `README.md` identifies the course and team but lists the project as TBD; `Study Flow/SysEn 5151 Project Team 30-09_18_2026.xml` is a model export artifact. No application source, test files, build configuration, or CI workflow appears in the complete repository inventory. The XML content was not reviewed and its filename does not establish alignment with the current N-01–N-10 baseline. This specification is a development handoff and model-to-specification linkage; runnable product linkage remains pending. Planned repository location: `/SPEC.md` at the repository root; this local file has not been uploaded.

Outside the current MVP: LMS/calendar integration, LLM/AI assistance, and smart reminders. The core demonstration must not depend on these services. A mock may represent a not-yet-implemented component, but the demonstration must identify it explicitly.

SR-01–SR-10 and their source acceptance criteria below are retained verbatim. Data/output contracts and example fixtures in Sections 3–5 are proposed derived specifications, not additional approved stakeholder requirements. Any inconsistency must be resolved with the team rather than silently changing the source baseline.

## 2. Needs, requirements, and acceptance baseline

Students own N-01–N-07; the Development Team owns N-08–N-10. The same numeric suffix connects N, SR, MOE/MOS, and AC. All acceptance execution statuses are **Not run**. A specification is not evidence that a feature is implemented or a test passed.

### SR-01 — N-01

**Stakeholder need:** Students need to see which task to work on next, along with its deadline and remaining workload, because a deadline list alone does not show what to do now.

**Requirement:** The StudyFlow system shall present a prioritized next task with its deadline, remaining workload, and rationale based on the documented prioritization policy and available study time.

**MOE-01:** Decision usefulness: proportion of student trials identifying the next task and explaining its rationale; time (s).

**Success target:** Proposed MOS-01: At least 80% of 50 trials (10 students × 5 scenarios) succeed within 30 s; at least 8 of 10 students rate usefulness ≥4/5.

**Acceptance criterion:** AC-01: Use 12 fixed priority scenarios to confirm the next task and rationale match the documented rule and tie-breaker; exclude completed tasks and show a no-task state when none remain. Conduct the timed student pilot in MOS-01.

**Method and evidence:** Fixed-fixture tests, demonstration, and timed student pilot; retain choices, times, explanations, and ratings.

**Proposed test identifier:** `accept_SR_01`. Implementation/test path: TBD. Execution status: Not run.

### SR-02 — N-02

**Stakeholder need:** Students need their remaining workload divided into manageable study sessions that fit their available time and finish before each deadline, because unplanned work leads to last-minute cramming.

**Requirement:** The StudyFlow system shall allocate remaining workload into study sessions within entered availability, without overlap and before task deadlines, subject to the documented maximum session length.

**MOE-02:** Capacity, deadline, and session fit: proportion of feasible scenarios satisfying availability, non-overlap, workload, deadline, and maximum-session constraints.

**Success target:** Proposed MOS-02: 100% of 12 feasible scenarios satisfy all constraints; no study session exceeds the team-approved maximum length.

**Acceptance criterion:** AC-02: Use 12 feasible scenarios to confirm blocks lie inside availability, never overlap, end by deadlines, allocate exactly remaining workload, and respect the agreed maximum session length.

**Method and evidence:** Constraint tests and student plan review; retain inputs, generated blocks, and independent constraint calculations.

**Proposed test identifier:** `accept_SR_02`. Implementation/test path: TBD. Execution status: Not run.

### SR-03 — N-03

**Stakeholder need:** Students need their plan to update when a task, deadline, workload estimate, completion status, or availability changes, because their week rarely goes as planned.

**Requirement:** The StudyFlow system shall regenerate the study plan from the latest saved task, deadline, workload, completion-status, and availability data whenever any of those inputs changes.

**MOE-03:** Adaptability: saved-change-to-plan time (s) and proportion of updated plans using the latest saved inputs.

**Success target:** Proposed MOS-03: 100% of 5 saved-change scenarios use the latest inputs; each updated plan appears within a proposed 5 s.

**Acceptance criterion:** AC-03: Save changes to task creation, deadline, workload estimate, completion status, and availability in 5 scenarios. Confirm replanning uses current records within MOS-03 and does not reschedule completed work.

**Method and evidence:** Saved-change tests and before/after demonstration; retain timestamps, inputs, and plans.

**Proposed test identifier:** `accept_SR_03`. Implementation/test path: TBD. Execution status: Not run.

### SR-04 — N-04

**Stakeholder need:** Students need to be told when their available time is not enough to complete all of their work, because they want to make tradeoffs before a deadline is missed.

**Requirement:** The StudyFlow system shall identify tasks whose remaining workload cannot be scheduled before their deadlines and report the unscheduled workload in minutes without exceeding entered availability.

**MOE-04:** Shortfall visibility: proportion of infeasible scenarios correctly identifying affected tasks and unscheduled workload (min).

**Success target:** Proposed MOS-04: 100% of 3 infeasible scenarios report the affected tasks and exact unscheduled workload; zero overbooked blocks.

**Acceptance criterion:** AC-04: Use 3 infeasible scenarios, including insufficient time before a deadline. Independently calculate remaining minus scheduled workload; compare affected tasks and reported minutes and confirm no overbooking.

**Method and evidence:** Shortfall calculation tests and student demonstration; retain unscheduled-minute calculations and messages.

**Proposed test identifier:** `accept_SR_04`. Implementation/test path: TBD. Execution status: Not run.

### SR-05 — N-05

**Stakeholder need:** Students need to create a useful plan without learning a complicated process, because time spent planning takes time away from studying.

**Requirement:** The StudyFlow system shall enable a first-time student to enter tasks and availability and generate an initial study plan through a guided workflow without external assistance.

**MOE-05:** Ease of use: first-plan completion time (min) and proportion of first-time students completing without assistance.

**Success target:** Proposed MOS-05: At least 8 of 10 first-time students create a valid initial plan within a proposed 5 min without assistance.

**Acceptance criterion:** AC-05: Observe 10 first-time students enter the same representative tasks and availability and generate a valid first plan. Record completion time, requests for help, and plan validity against MOS-05.

**Method and evidence:** Observed usability pilot; retain times, assistance requests, and resulting plans.

**Proposed test identifier:** `accept_SR_05`. Implementation/test path: TBD. Execution status: Not run.

### SR-06 — N-06

**Stakeholder need:** Students need their saved tasks and availability to remain available between sessions, because re-entering information discourages continued use.

**Requirement:** The StudyFlow system shall restore successfully saved task and availability records when the same student reopens the application.

**MOE-06:** Data availability: proportion of successfully saved task and availability fields restored after reopening.

**Success target:** Proposed MOS-06: 100% of saved fields restored across 5 close/reopen scenarios; zero lost or altered saved records.

**Acceptance criterion:** AC-06: Save representative task and availability records, close and reopen the application in 5 scenarios, and compare all saved fields for the same student against the pre-close records.

**Method and evidence:** Close/reopen persistence tests; retain pre/post records and comparison results.

**Proposed test identifier:** `accept_SR_06`. Implementation/test path: TBD. Execution status: Not run.

### SR-07 — N-07

**Stakeholder need:** Students need their academic and availability information to remain private, because exposed personal data would make them stop trusting the tool.

**Requirement:** The StudyFlow system shall restrict access to a student's academic and availability records to that student under the documented user-access model.

**MOE-07:** Data privacy: number of unauthorized disclosures of student records in the access-test matrix.

**Success target:** Proposed MOS-07: Zero unauthorized disclosures across all cases in the approved user-access matrix.

**Acceptance criterion:** AC-07: Exercise the approved access matrix, including unauthenticated access, another student's direct record request, and session/user switching where supported. Confirm no academic or availability data is disclosed without authorization.

**Method and evidence:** Access-control tests and privacy review; retain access matrix and disclosure results.

**Proposed test identifier:** `accept_SR_07`. Implementation/test path: TBD. Execution status: Not run.

### SR-08 — N-08

**Stakeholder need:** The Development Team needs planning rules that are testable and explainable, because the team must verify recommendations and reproduce defects.

**Requirement:** The StudyFlow project shall document planning rules and their expected results and provide repeatable test cases that produce identical outputs from identical inputs and rule versions.

**MOE-08:** Verifiability and explainability: repeatability of outputs and proportion of planning rules with documented expected results.

**Success target:** Proposed MOS-08: 100% of 12 planning scenarios repeat identically across 3 runs; 100% of planning rules have an expected-result case.

**Acceptance criterion:** AC-08: Inspect rule documentation and expected-result fixtures; execute 12 fixed planning scenarios 3 times with identical inputs and rule versions. Compare outputs and require complete rule coverage.

**Method and evidence:** Documentation inspection and repeated scenario execution; retain rule versions, fixtures, and outputs.

**Proposed test identifier:** `accept_SR_08`. Implementation/test path: TBD. Execution status: Not run.

### SR-09 — N-09

**Stakeholder need:** The Development Team needs every MVP feature to trace to an approved stakeholder need within a defined MVP boundary, because untraced or optional features consume limited project time.

**Requirement:** The StudyFlow project shall maintain bidirectional traceability from every MVP feature to an approved stakeholder need and requirement within the documented MVP boundary.

**MOE-09:** Traceability and scope control: proportion of MVP features with approved need/requirement links; number outside the approved boundary.

**Success target:** Proposed MOS-09: 100% of MVP features trace to approved needs and requirements; zero features outside the approved boundary without an approved change.

**Acceptance criterion:** AC-09: Inspect the MVP boundary and traceability matrix. Confirm all 10 needs and SR-01–SR-10 have source links and acceptance cases, and every MVP feature has an approved need/requirement link. Record approved scope changes separately.

**Method and evidence:** Traceability and scope inspection; retain matrix, SPEC.md version, approvals, and pending test status.

**Proposed test identifier:** `accept_SR_09`. Implementation/test path: TBD. Execution status: Not run.

### SR-10 — N-10

**Stakeholder need:** The Development Team needs the user interface, planning logic, and data storage to be changed and tested independently, because tightly coupled components make changes risky.

**Requirement:** The StudyFlow system shall provide documented component interfaces that allow the user interface, planning logic, and data storage to be changed and tested independently.

**MOE-10:** Modularity and change resilience: proportion of independently executable component tests and unaffected regression cases passing after a controlled change.

**Success target:** Proposed MOS-10: 100% of planning tests run without the UI or persistent store; all unaffected baseline regression cases pass after a controlled component change.

**Acceptance criterion:** AC-10: Run planning tests with in-memory fixtures without UI or persistent storage. Apply a controlled change through one documented component interface; confirm other components need no change and all unaffected regressions pass. Approve intentional expected-result changes before rerunning.

**Method and evidence:** Interface inspection and isolated regression tests; retain change record and before/after results.

**Proposed test identifier:** `accept_SR_10`. Implementation/test path: TBD. Execution status: Not run.

## 3. Proposed data contract

These field names describe a logical interface; they do not prescribe a programming language, endpoint, database, or UI framework. Map them to actual repository types after code review.

| Record / field | Type / unit | Required | Rule |
|---|---|---|---|
| Task.task_id | Stable string | Yes | Unique within the student's saved task set; unchanged by edits. |
| Task.title | Nonempty string | Yes | Display label, not a sorting key. |
| Task.deadline | Timestamp with UTC offset | Yes | Use one recorded student time zone for display; compare absolute instants. |
| Task.remaining_minutes | Integer minutes ≥ 0 | Yes | Work still to do, not original total; completed work is excluded. |
| Task.status | pending / in_progress / completed | Yes | Completed implies remaining_minutes = 0. Reject inconsistent records. |
| Task.priority | Team-defined ordered value | TBD | Only used if the approved sorting policy includes it; define scale and default before testing. |
| Task.owner_id | Authenticated owner identifier | Yes under multi-user model | Obtained from trusted session context; never authorize from a client-supplied owner alone. |
| Availability.interval_id | Stable string | Yes | Identifies an editable availability interval. |
| Availability.start / end | Timestamps with offsets | Yes | start < end; intervals are half-open [start, end). |
| Availability.owner_id | Owner identifier | As above | Availability and tasks must belong to the same authorized student. |
| PlanningContext.now | Fixed timestamp | Yes | Inject into deterministic tests; do not rely on the wall clock. |
| PlanningContext.horizon_start / end | Timestamps | Yes | Explicit horizon; workload outside the horizon is not silently omitted. |
| PlanningContext.max_session_minutes | Positive integer minutes | Yes | Value requires team approval; source report does not specify a number. |
| PlanningContext.rule_version | String | Yes | Record prioritization and scheduling policy version. |
| SavedState.input_revision | Increasing revision or equivalent token | Yes | Distinguishes the inputs used by a generated plan. |

Task/availability data originate from manual student entry in the MVP. Replan after each successfully saved task, deadline, workload, completion, or availability change (SR-03). Load saved records when the same authorized student reopens the application (SR-06). No external API refresh cadence is required for the current scope.

Proposed input handling:
- Reject missing required fields, invalid timestamps, negative/noninteger workloads, and zero/negative-duration availability; show a field-specific error.
- Do not save a partially valid record or replace a valid plan with a plan based on rejected inputs.
- Overlapping availability must not count twice. Adopt either normalization into nonoverlapping intervals or rejection with a correction message; this decision is pending.
- A task with remaining work and a deadline at/before the planning start is reported as an overdue shortfall; do not schedule work before now.
- Empty availability with unfinished work produces a shortfall, not an apparently feasible plan.
- Failed persistence must not be presented as a successful save. Preserve the last confirmed saved state and offer retry.
- The MVP must remain usable without LMS, calendar, or LLM connectivity.

## 4. Proposed planning and output contract

### 4.1 Determinism and recommendation policy

For identical task records, availability, planning time, horizon, configuration, and rule version, planning outputs must be identical (SR-08). Runtime measurements and nondeterministic identifiers are excluded from output comparison.

The source does **not** define the exact prioritization algorithm or tie-breaker. Before AC-01 execution, the team must approve a total ordering that explicitly states:
1. How deadline, remaining workload, available study time, and any assigned priority affect the ranking.
2. How ties are resolved using stable task identifiers.
3. Which task is recommended when the earliest-deadline task cannot receive a feasible session.
4. What is displayed when unfinished work exists but no work can be scheduled now.

Do not use an unexplained score or generate expected rankings by calling the implementation being tested. Freeze independent expected rankings before execution. No LLM is required.

### 4.2 Scheduling invariants

For each generated session:
- The task exists, is not completed, and has positive remaining work.
- start < end; duration_minutes equals elapsed minutes and is positive.
- The session lies wholly within a nonoverlapping availability interval and the stated planning horizon.
- Sessions for a student do not overlap; an end equal to the next start is allowed.
- Session end is no later than the task deadline.
- Session duration does not exceed the approved maximum.

For each unfinished task: scheduled_minutes + unscheduled_minutes = remaining_minutes. For a feasible scenario, unscheduled_minutes = 0 for every task. For an infeasible scenario, report exact unscheduled minutes by task; never exceed availability to hide a shortfall. A shortfall describes this plan under the approved policy/horizon; do not claim global mathematical impossibility unless the algorithm proves it.

### 4.3 Logical response fields

| Field | Expected content |
|---|---|
| input_revision | Saved input revision used for this result. |
| rule_version | Approved policy version used. |
| plan_state | feasible / shortfall / no_tasks / invalid_input / error. |
| next_task | Task ID, title, deadline, remaining minutes, and rationale; null when no task is recommended. |
| sessions | Ordered records containing task_id, start, end, duration_minutes. |
| shortfalls | task_id, unscheduled_minutes, and understandable reason. |
| validation_errors | Field/task identifiers and correction messages; empty for valid input. |

A rationale must explain the approved policy's relevant deadline/workload/availability factors, not merely repeat a numeric score. If no unfinished tasks exist, show a no-task state with no sessions. If unscheduled work exists, display it explicitly even if a next task can still be recommended.

Proposed stale-result handling: associate each response with its input revision; an older response must not overwrite a plan produced from newer saved inputs. On a save failure, retain the last confirmed state and show the failure. On a planning failure, show an error and identify any retained previous plan as stale.

### 4.4 Storage, privacy, and component boundaries

Proposed component roles:
- UI: validates entry, saves changes, and displays recommendations, sessions, errors, and shortfalls.
- Planning logic: accepts explicit input records/context; returns the response above; runs with in-memory fixtures without UI or persistent storage.
- Storage adapter: loads/saves authorized student records and reports success/failure.

Concrete signatures and repository paths are pending. SR-10 requires interfaces to be documented, not a particular framework.

SR-07 requires a documented access model. Decide whether the product is an authenticated multi-user service or a local single-user prototype. A local/stubbed demonstration cannot establish cross-user privacy. Privacy acceptance stays pending until the implemented access matrix is reviewed and tested. Do not claim encryption, cloud synchronization, authentication, or authorization mechanisms without implementation evidence.

## 5. Fixed example fixtures and acceptance execution

These are proposed fixtures illustrating the contracts. They are not the complete 12-scenario acceptance suite, and no test has been run.

### F-01 — Capacity fit, session cap, and next-task trace

Fixed planning time: 2026-10-07T09:00:00-04:00.
Horizon: 09:00–12:00 on that day. Availability: 09:00–10:30.
- T-A: “Calculus practice”; deadline 10:00; remaining 30 min.
- T-B: “Reading notes”; deadline 12:00; remaining 60 min.
- Both tasks are pending.
- Fixture-only maximum session length: 30 min. This value does not establish the product default.

One valid schedule is T-A 09:00–09:30, T-B 09:30–10:00, T-B 10:00–10:30. Scheduled total = 90 min; each task's shortfall = 0. AC-02 passes for this fixture if every invariant holds; other valid schedules may pass. The expected next task/rationale for AC-01 must be independently recorded after the policy is approved.

### F-02 — Exact shortfall

Same planning time; availability 09:00–09:30; one task T-C with deadline 10:00 and remaining 60 min. Maximum session length = 30 min for this fixture.

Expected: at most 30 min scheduled; if all usable capacity is allocated, exactly 30 min unscheduled; no block outside availability. Display T-C's shortfall explicitly. The finalized scheduling policy must define allocation of available capacity so exact expected outputs can be frozen.

### F-03 — Completed / empty workload

All tasks completed with remaining_minutes = 0.
Expected: no_tasks state, next_task = null, sessions empty, and no remaining-work shortfall.

### F-04 — Replanning on a saved change

Start from F-01. Save a change marking T-A completed and remaining_minutes = 0. Record the new input revision.
Expected: the new plan references that revision, contains no T-A session, and does not restore T-A as the next task. Measure saved-change-to-visible-plan latency against the proposed 5 s target in MOS-03.

### Required suite and evidence

| AC | Planned execution / minimum source coverage |
|---|---|
| AC-01 | 12 independently ranked fixtures: include ties, completed work, no tasks, different workloads/deadlines/availability. Plus 50 timed trials with 10 students and usefulness ratings. |
| AC-02 | 12 feasible scenarios covering capacity, non-overlap, deadlines, remaining workload, and maximum-session boundaries. |
| AC-03 | 5 saved-change cases: creation, deadline, workload, completion, availability. |
| AC-04 | 3 infeasible cases with independently computed shortfalls; include deadline-limited capacity. |
| AC-05 | 10 first-time students; record validity, time, and assistance. |
| AC-06 | 5 close/reopen cases; compare all successfully saved task/availability fields. |
| AC-07 | Approved access matrix; include unauthenticated and cross-user access/session switching where applicable. |
| AC-08 | 12 scenarios repeated 3 times; expected-result coverage for every approved planning rule. |
| AC-09 | Inspect source links and feature-to-need/requirement matrix, including all 10 SRs and acceptance cases. |
| AC-10 | Isolated planning tests and controlled component change; all unaffected regressions pass. |

Numerical targets remain proposed, as in the source report. Do not represent pilot participants, timing results, saved-state success, or privacy results as collected evidence until they are collected.

## 6. Test implementation and CI handoff

Suggested identifiers are accept_SR_01 through accept_SR_10. They are intended names, not existing test files. Some identifiers denote manual pilot/inspection procedures, not automated unit tests.

Before acceptance:
1. Approve the pending policy/configuration decisions and freeze fixtures with independent expected outcomes.
2. Implement meaningful automated checks for deterministic behavior, schedule constraints, saved-change behavior, restoration, and access control as applicable.
3. For unmet behavior, record an executed failing assertion rather than describing an unimplemented test as a failing test.
4. Run automated checks in CI when application code and test infrastructure are added to the repository. Record actual command, environment, commit, and test output.
5. Run usability pilots and inspections separately; automation does not substitute for student validation.

Test record fields: AC/test ID, source SR, fixture or procedure version, commit, environment, expected result, observed result, execution date, tester, and Pass / Fail / Not run / Blocked. Expected behavior blocked by an unapproved rule is Blocked, not Pass. Current document status: no implementation paths confirmed; no tests executed; no CI result available.

## 7. Model-to-product linkage for Area 6

| Model need | Requirement | Specification evidence | Code/test evidence | Current status |
|---|---|---|---|---|
| N-01 | SR-01 | Section 2 / AC-01; applicable contracts in Sections 3–4 | TBD: actual path/function/test and reviewed commit | Specification drafted; implementation unverified |
| N-02 | SR-02 | Section 2 / AC-02; applicable contracts in Sections 3–4 | TBD: actual path/function/test and reviewed commit | Specification drafted; implementation unverified |
| N-03 | SR-03 | Section 2 / AC-03; applicable contracts in Sections 3–4 | TBD: actual path/function/test and reviewed commit | Specification drafted; implementation unverified |
| N-04 | SR-04 | Section 2 / AC-04; applicable contracts in Sections 3–4 | TBD: actual path/function/test and reviewed commit | Specification drafted; implementation unverified |
| N-05 | SR-05 | Section 2 / AC-05; applicable contracts in Sections 3–4 | TBD: actual path/function/test and reviewed commit | Specification drafted; implementation unverified |
| N-06 | SR-06 | Section 2 / AC-06; applicable contracts in Sections 3–4 | TBD: actual path/function/test and reviewed commit | Specification drafted; implementation unverified |
| N-07 | SR-07 | Section 2 / AC-07; applicable contracts in Sections 3–4 | TBD: actual path/function/test and reviewed commit | Specification drafted; implementation unverified |
| N-08 | SR-08 | Section 2 / AC-08; applicable contracts in Sections 3–4 | TBD: actual path/function/test and reviewed commit | Specification drafted; implementation unverified |
| N-09 | SR-09 | Section 2 / AC-09; applicable contracts in Sections 3–4 | TBD: actual path/function/test and reviewed commit | Specification drafted; implementation unverified |
| N-10 | SR-10 | Section 2 / AC-10; applicable contracts in Sections 3–4 | TBD: actual path/function/test and reviewed commit | Specification drafted; implementation unverified |

The primary live chain should use N-01 → SR-01 → the actual modeled use case/function → AC-01 → implementing code → displayed next task. The model function ID, code path, and reviewed commit are pending and must not be invented.

Proposed walking-skeleton demonstration:
1. State StudyFlow's system boundary and current manual-entry scope.
2. Enter representative tasks, deadlines, workload, and availability.
3. Generate and display the study sessions and next-task recommendation.
4. Open N-01 and SR-01 in Innoslate and show their trace.
5. Open AC-01 here and point to the actual code/test in the reviewed repository.
6. Identify real versus stubbed participants and any missing capability.

A runnable skeleton may cover one path while other requirements are pending. Creating this file alone does not establish a Proficient Area 6 rating.

## 8. Decisions and material still required from the team

| Item | What to supply / approve | Impact |
|---|---|---|
| Implementation | Repository URL, main branch, and reviewed commit are recorded above; supply application code, language/framework, and start/test instructions | Enables actual code/test links and implementation review. |
| Model behavior | Exact primary use-case/function IDs and diagram links | Completes model-to-product trace. |
| Prioritization | Explicit ordering, factors, tie-breaker, and infeasible-task treatment | AC-01/AC-08 expected outputs cannot be finalized without it. |
| Scheduling | Planning horizon, maximum session length, minute granularity, and capacity-allocation policy | Makes feasibility and shortfall tests reproducible. |
| Input semantics | Priority scale/default, overlapping availability treatment, partial completion handling, and time-zone policy | Finalizes data contract and boundary fixtures. |
| Persistence/access | Actual saved-state mechanism and authorized user/session model | Enables AC-06/AC-07 evidence. |
| Threshold approval | Approval or revision of MOS-01–MOS-10 numerical targets | Distinguishes proposed targets from agreed acceptance gates. |
| Evidence | Actual demo, test output, pilot records, and CI link | Supports submission claims; currently unavailable. |

All owners and decision dates are pending team assignment. Once supplied, update this same SPEC.md, link actual files and entities, and record the approved version. Changes to approved SRs must be synchronized with the Google Doc and Innoslate.

## 9. Provenance and change record

This draft was prepared with AI assistance from the team's Google Doc and the user's request to produce a SPEC.md for the desktop. It preserves the source requirement statements, acceptance criteria, and proposed targets. Sections 3–8 contain explicitly proposed contracts, fixtures, and implementation handoff details.

Read-only repository inventory, main-branch metadata, and README inspection were performed. No source interview, application code execution, pilot, or Innoslate mutation was performed while creating this file. The team must review technical decisions and verify all implementation/evidence claims before submission.

| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-10-05 | Initial source-aligned draft for N-01–N-10 and SR-01–SR-10; proposed contracts and pending decisions documented. |
