# Test → requirement mapping

31 tests passed in local Python unittest (0 failures/errors). Test IDs refer to existing native XML requirements; associations below are implementation verification contributions, not newly created Innoslate relationships. Python invokes the real JavaScript through Node. Latest execution context and source digests are written to `evidence/ci-summary.json` by `python3 scripts/verify.py`. Earlier desktop results remain outside this working package.

| Existing test | Existing requirement / native entity | Evidence scope |
|---|---|---|
| `test_SR_01_priority_fixed_scenarios` | SR-01 / 249213 | 12 selected-task ranking cases; displayed rationale not asserted. |
| `test_1_4_3_remaining_work` | 1.4.3 / 263033 | Core/storage fixture; not complete system acceptance. |
| `test_CR_01_constraints_validation` | CR-1 / 287374 | Core/storage fixture; not complete system acceptance. |
| `test_CR_02_commitments_and_overlap_normalization` | CR-2 / 287375 | Core/storage fixture; not complete system acceptance. |
| `test_CR_03_long_window_multiple_sessions` | CR-3 / 287376 | Core/storage fixture; not complete system acceptance. |
| `test_CR_04_detect_invalid_proposal` | CR-4 / 287377 | Core/storage fixture; not complete system acceptance. |
| `test_SR_02_deadline_capacity_and_no_overlap` | SR-02 / 249214 | Core/storage fixture; not complete system acceptance. |
| `test_SR_04_overdue_and_empty_availability` | SR-04 / 249218 | Core/storage fixture; not complete system acceptance. |
| `test_CR_10_session_task_association` | CR-10 / 287392 | Core/storage fixture; not complete system acceptance. |
| `test_CR_12_repeatable_fixed_context` | CR-12 / 289389 | Core/storage fixture; not complete system acceptance. |
| `test_CR_13_no_external_service_or_storage` | CR-13 / 289390 | Core/storage fixture; not complete system acceptance. |
| `test_CR_17_active_profile_separation` | CR-17 / 289420 | Core/storage fixture; not complete system acceptance. |
| `test_SR_06_storage_roundtrip_and_write_failure` | SR-06 / 249220 | Core/storage fixture; not complete system acceptance. |
| `test_SR_06_UI_reopen_and_invalid_saved_profile` | SR-06 / 249220 | Event harness with actual app handlers; native browser/timing not established. |
| `test_CR_16_representative_planning_time` | CR-16 / 289419 | 250-task core planning timing only; draft CR-16 bound, not UI response time. |
| `test_CR_02_never_schedule_before_now` | CR-2 / 287375 | Core/storage fixture; not complete system acceptance. |
| `test_SR_03_what_if_preview_matches_applied_window` | SR-03 / 249217 | Manually constructed profile agreement; actual preview/apply handlers not exercised. |
| `test_CR_02_dst_local_calendar_days` | CR-2 / 287375 | Core/storage fixture; not complete system acceptance. |
| `test_SR_03_UI_boot_save_edit_replan` | SR-03 / 249217 | Event harness with actual app handlers; native browser/timing not established. |
| `test_SR_03_UI_failed_save_rolls_back` | SR-03 / 249217 | Event harness with actual app handlers; native browser/timing not established. |
| `test_SR_07_UI_switch_keeps_profile_data_separate` | SR-07 / 249221 | Event harness with actual app handlers; native browser/timing not established. |
| `test_SR_02_twelve_feasible_scenarios` | SR-02 / 249214 | 12 feasible cases with independent expected task/start/duration outputs and zero shortfalls. |
| `test_SR_08_CR_12_twelve_scenarios_three_runs` | SR-08 / 249226; CR-12 / 289389 | 12 fixed scenarios × 3 runs, exact expected outputs plus equality and input-preservation checks; full approved-rule/rationale coverage remains pending. |
| `test_SR_03_UI_creation_updates_schedule` | SR-03 / 249217 | Event harness with actual app handlers; native browser/timing not established. |
| `test_SR_03_UI_deadline_updates_schedule` | SR-03 / 249217 | Event harness with actual app handlers; native browser/timing not established. |
| `test_SR_03_UI_workload_updates_schedule` | SR-03 / 249217 | Event harness with actual app handlers; native browser/timing not established. |
| `test_SR_03_UI_completion_updates_schedule` | SR-03 / 249217 | Event harness with actual app handlers; native browser/timing not established. |
| `test_SR_03_UI_availability_updates_schedule` | SR-03 / 249217 | Event harness with actual app handlers; native browser/timing not established. |
| `test_SR_04_three_shortfall_scenarios` | SR-04 / 249218 | Three independently calculated shortage cases: total capacity, deadline-limited capacity and overdue work. |
| `test_CR_01_normalized_constraints_positive` | CR-1 / 287374 | Core/storage fixture; not complete system acceptance. |
| `test_CR_05_valid_partial_plan_preserves_outputs` | CR-5 / 287378 | Core/storage fixture; not complete system acceptance. |

## Run locally

From `04-整理后的代码`:

```sh
python3 -m unittest discover -s tests -v
```

## Limits

- Native browser and storage recovery remain pending.
- No remote CI was run.
- Access-control acceptance is not established by profile-switch tests.
- 12 × 3 repetition is recorded, but complete approved-rule coverage and rationale inspection are not established.
- SR-03 suite asserts output changes; no end-to-end response-time acceptance claim.
