# Selected F.1.5 traceability

Source: [native XML baseline](../model/StudyFlow-baseline.xml). Recorded entity IDs and relationships are checked by `scripts/check_traceability.py`. Source fingerprint and all 18 component allocations are in [traceability.json](traceability.json). Function-to-code/test rows below are implementation contributions, not new model entities or relationships.

| Function / entity | Component / entity | Requirement / entity | Code | Tests |
|---|---|---|---|---|
| F.1.5.1 / 281416 | C.2.5.1 / 281610 | CR-1 / 287374 | [identifySchedulingConstraints](../Study%20Flow/js/planning.js#L101) | `test_CR_01_constraints_validation`; `test_CR_01_normalized_constraints_positive` |
| F.1.5.2 / 281417 | C.2.5.2 / 281611 | CR-2 / 287375 | [determineAvailableStudySlots](../Study%20Flow/js/planning.js#L173) | `test_CR_02_commitments_and_overlap_normalization`; `test_CR_02_never_schedule_before_now`; `test_CR_02_dst_local_calendar_days` |
| F.1.5.3 / 281418 | C.2.5.3 / 281612 | CR-3 / 287376 | [allocatePrioritizedTasks](../Study%20Flow/js/planning.js#L222) | `test_CR_03_long_window_multiple_sessions`; `test_SR_02_twelve_feasible_scenarios` |
| F.1.5.4 / 281419 | C.2.5.4 / 281613 | CR-4 / 287377 | [evaluateScheduleFeasibility](../Study%20Flow/js/planning.js#L272) | `test_CR_04_detect_invalid_proposal` |
| F.1.5.5 / 281420 | C.2.5.5 / 281614 | CR-5 / 287378 | [assembleStudyPlan](../Study%20Flow/js/planning.js#L325) | `test_CR_05_valid_partial_plan_preserves_outputs`; `test_CR_10_session_task_association`; `test_CR_04_detect_invalid_proposal` |

## Scope and open decisions

- Each CR-1..CR-5 is traced from 1.4.5; each listed function decomposes F.1.5 and is performed by the listed module. The component satisfies link is design allocation, not proof of passing code.
- Parent model input is Prioritized Task Set; the code receives raw profile and ranks internally. CR-6 / boundary equivalence remains pending review.
- Additional context parameters are implementation details; do not invent native IDEF0 arrows.
- C.2.5.1 entity 281610 is the allocated module; duplicate New Asset 281615 is excluded.
- Model controls are Preserve saved data and Maintain traceability and scope. CR-14 acceptance remains unresolved.
- Plan blocks are internal calendar-view data; no external calendar transport or authenticated access is implemented.
- 1.4.6 plan-confirmation behavior remains missing; it is not replaced by saving task inputs.
- See [test mapping](test-requirement-map.md) for actual assertion scope and [verification](verification.md) for recorded execution context.
