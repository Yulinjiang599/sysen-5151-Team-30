"""Requirement-named checks against the real JavaScript implementation.

The application is JavaScript. Python unittest invokes Node rather than testing a
second Python implementation. The DOM harness checks event wiring, not rendering.
Run: python3 -m unittest discover -s tests -v
"""

import json
import os
from pathlib import Path
import shutil
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]
CASE_FILE = ROOT / "tests" / "js_cases.cjs"
CASES = (
    "test_SR_01_priority_fixed_scenarios",
    "test_1_4_3_remaining_work",
    "test_CR_01_constraints_validation",
    "test_CR_02_commitments_and_overlap_normalization",
    "test_CR_03_long_window_multiple_sessions",
    "test_CR_04_detect_invalid_proposal",
    "test_SR_02_deadline_capacity_and_no_overlap",
    "test_SR_04_overdue_and_empty_availability",
    "test_CR_10_session_task_association",
    "test_CR_12_repeatable_fixed_context",
    "test_CR_13_no_external_service_or_storage",
    "test_CR_17_active_profile_separation",
    "test_SR_06_storage_roundtrip_and_write_failure",
    "test_SR_06_UI_reopen_and_invalid_saved_profile",
    "test_CR_16_representative_planning_time",
    "test_CR_02_never_schedule_before_now",
    "test_SR_03_what_if_preview_matches_applied_window",
    "test_CR_02_dst_local_calendar_days",
    "test_SR_03_UI_boot_save_edit_replan",
    "test_SR_03_UI_failed_save_rolls_back",
    "test_SR_07_UI_switch_keeps_profile_data_separate",
    "test_SR_02_twelve_feasible_scenarios",
    "test_SR_08_CR_12_twelve_scenarios_three_runs",
    "test_SR_03_UI_creation_updates_schedule",
    "test_SR_03_UI_deadline_updates_schedule",
    "test_SR_03_UI_workload_updates_schedule",
    "test_SR_03_UI_completion_updates_schedule",
    "test_SR_03_UI_availability_updates_schedule",
    "test_SR_04_three_shortfall_scenarios",
    "test_CR_01_normalized_constraints_positive",
    "test_CR_05_valid_partial_plan_preserves_outputs",
)


class FunctionalRequirements(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.node = shutil.which("node")
        if not cls.node:
            raise RuntimeError("Node.js is required; install Node 22 or later.")


def requirement_check(name):
    def check(self):
        result = subprocess.run(
            [self.node, str(CASE_FILE), name], cwd=ROOT, capture_output=True,
            text=True, timeout=20, env={**os.environ, "TZ": "America/New_York"},
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(json.loads(result.stdout)["status"], "passed")
    check.__name__ = name
    return check


for case in CASES:
    setattr(FunctionalRequirements, case, requirement_check(case))

if __name__ == "__main__":
    unittest.main()
