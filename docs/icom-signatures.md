# ICOM and code signatures

Selected function: **F.1.5 Generate Feasible Study Plan**. Physical mechanism: **C.2.5 Feasible Plan Generation Subsystem**. Its five logical mechanisms map to named functions in [planning.js](../Study%20Flow/js/planning.js).

## Model arrows and corresponding code

| Function / mechanism | Input in the second-level model | Output in the second-level model | Actual code signature |
|---|---|---|---|
| F.1.5.1 / C.2.5.1 Scheduling Constraint Module | Prioritized Task Set | Scheduling Constraints | `identifySchedulingConstraints(profile, controls)` |
| F.1.5.2 / C.2.5.2 Study Slot Identification Module | Scheduling Constraints | Available Study Slots | `determineAvailableStudySlots(constraints)` |
| F.1.5.3 / C.2.5.3 Task Allocation Module | Available Study Slots; task information retained in the planning context | Proposed Study Sessions | `allocatePrioritizedTasks(prioritizedTasks, availableSlots, constraints)` |
| F.1.5.4 / C.2.5.4 Schedule Feasibility Evaluation Module | Proposed Study Sessions; applicable constraints | Feasibility Assessment | `evaluateScheduleFeasibility(proposal, constraints, availableSlots)` |
| F.1.5.5 / C.2.5.5 Study Plan Assembly Module | Feasibility Assessment | Feasible Study Plan; Study Calendar Updates | `assembleStudyPlan(proposal, assessment)` |

The model's internal arrow names above are retained. Code needs explicit accompanying data: task records, availability, fixed commitments, proposed sessions and scheduling time. These parameters describe implementation data propagation; they do not introduce additional approved model entities or arrows. The orchestration function `generateFeasibleStudyPlan(profile, controls)` performs the ranking and all five steps. `calculateTaskPriorities(tasks, now)` can also be tested separately as F.1.4.

## Controls

- **Scheduling policy:** today plus six local calendar dates, 90-minute maximum session, half-open intervals and whole-minute durations. A caller may explicitly supply planning time, horizon and session limit for independent tests.
- **Prioritization policy:** `0.62 × urgency + 0.38 × pressure`, with deadline, remaining minutes and lexical ID tie-breaks. These values come from the supplied demo.
- **Preserve saved data:** pure planning reads copies; storage changes occur through the adapter after a valid plan can be produced. Failed confirmed input saves roll the UI back.
- **Maintain traceability/scope:** JSDoc IDs, the traceability table and the contract checker maintain project evidence. CR-14 is not claimed as an implemented runtime requirements-management interface.
- **Time:** UI supplies one clock snapshot to recalculation. Tests pass a fixed instant. Calendar windows use the browser's local timezone; the CI fixes `America/New_York` for reproducible examples, including a daylight-saving transition.

## Boundary shapes

`profile` contains `tasks`, weekly `availability` and `commitments`. `controls` contains optional `now`, `horizonDays`, `maxSessionMinutes` and `extraMinutes`. The profile is selected by the browser application before entering the core; the core does not receive the other demo profile.

The returned plan is `{blocks, shortfalls}`. A block has `taskId`, `name`, `start`, `end`, `duration` and `status`; a shortfall has `taskId`, `name` and `minutes`. Dates are JavaScript `Date` values in memory and ISO timestamps when JSON serialized. The browser calendar renders these same blocks as its internal calendar-update data.

`constraints`, `proposal` and `assessment` are explicit intermediate values. The assessment has `valid`, `feasible`, `issues` and `unscheduledMinutes`. Invalid proposed sessions cannot be assembled into a published plan. Empty capacity and overdue unfinished tasks produce explicit shortfalls.

See [api-v1.yaml](../contracts/api-v1.yaml) for machine-readable local-operation and data-shape definitions. No HTTP transport is implemented by the standalone demo.
