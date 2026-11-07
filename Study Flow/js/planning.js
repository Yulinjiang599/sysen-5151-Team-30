/**
 * StudyFlow planning logic, used by both the HTML application and Node tests.
 * Model: F.1.3, F.1.4, F.1.5 and F.1.5.1–F.1.5.5.
 * Mechanism: C.2.5 Feasible Plan Generation Subsystem and its five modules.
 * I: active student's task set, recurring availability and fixed commitments.
 * C: explicit planning time, seven calendar days, 90-minute session limit,
 *    weighted urgency/pressure policy; no external service or persistent state.
 * O: ranked tasks, feasibility assessment, study sessions/calendar updates,
 *    exact unscheduled minutes by task. See docs/traceability.md for source IDs.
 * M: pure JavaScript functions; no DOM, network or storage dependency.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.StudyFlowPlanning = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MINUTE = 60000;
  const RULE_VERSION = 'urgency-pressure-v1';
  const DEFAULTS = Object.freeze({horizonDays: 7, maxSessionMinutes: 90});

  function date(value, field) {
    const result = new Date(value);
    if (value == null || !Number.isFinite(+result)) throw new TypeError(`${field}: invalid timestamp`);
    return result;
  }

  /** F.1.3 Analyze Deadlines and Workload; I: Task; O: remaining minutes. */
  function remaining(task) {
    return task.status === 'done' ? 0 : Math.max(0, task.minutes - (task.completed || 0));
  }

  /** F.1.1 Receive and Maintain Academic Task Data; validate before saving/planning. */
  function validateTasks(tasks) {
    if (!Array.isArray(tasks)) throw new TypeError('tasks: expected an array');
    const ids = new Set();
    for (const task of tasks) {
      if (!task || typeof task.id !== 'string' || !task.id || ids.has(task.id)) throw new TypeError('task.id: missing or duplicate');
      ids.add(task.id);
      if (typeof task.name !== 'string' || !task.name.trim()) throw new TypeError('task.name: required');
      date(task.deadline, 'task.deadline');
      if (!Number.isInteger(task.minutes) || task.minutes < 0) throw new TypeError('task.minutes: expected nonnegative integer');
      const completed = task.completed ?? 0;
      if (!Number.isInteger(completed) || completed < 0 || completed > task.minutes) throw new TypeError('task.completed: must be between zero and workload');
      if (!['todo', 'progress', 'done'].includes(task.status)) throw new TypeError('task.status: invalid status');
    }
    return true;
  }

  /** F.1.4 Calculate Task Priorities; C: fixed time and documented 0.62/0.38 rule. */
  function scoreTask(task, now = new Date()) {
    const hours = Math.max(0, (+date(task.deadline, 'task.deadline') - +date(now, 'now')) / 3600000);
    const urgency = 1 / (1 + hours / 24);
    const pressure = Math.min(1, remaining(task) / Math.max(60, hours * 30));
    return 0.62 * urgency + 0.38 * pressure;
  }

  /** F.1.4; I: validated tasks; O: Prioritized Task Set; overdue work is reported separately. */
  function calculateTaskPriorities(tasks, now = new Date()) {
    validateTasks(tasks);
    const instant = date(now, 'now');
    return tasks.filter(task => remaining(task) > 0 && +new Date(task.deadline) > +instant)
      .map(task => ({...task, remaining: remaining(task), score: scoreTask(task, instant)}))
      .sort((a, b) => b.score - a.score || +new Date(a.deadline) - +new Date(b.deadline)
        || b.remaining - a.remaining || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }

  function clockMinutes(value) {
    if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new TypeError('availability: expected HH:mm');
    const [hour, minute] = value.split(':').map(Number);
    return hour * 60 + minute;
  }

  /**
   * F.1.5.1 Identify Scheduling Constraints
   * Requirement: CR-1; system source: 1.4.5.
   * Model mechanism: C.2.5.1 (entity 281610).
   * Model I: Prioritized Task Set. Model O: Scheduling Constraints.
   * Implementation I: raw active profile (tasks, weekly availability, commitments).
   * Implementation C: reference time, horizon, maximum session length and extra-time option.
   * Implementation O: copied task/window records, normalized commitment dates and planning context.
   * M: C.2.5.1 Scheduling Constraint Module; this pure JavaScript function implements its logic.
   * Boundary gap: XML expects prioritized input; this signature accepts raw profile data.
   * CR-6 is a parent-boundary obligation pending review, not established by this signature.
   *
   * @param {Object} profile Active profile; tasks and availability are required; commitments optional.
   * @param {Object} [controls={}] Implementation context, not a new model control entity.
   * @param {Date|string|number} [controls.now] Reference instant; defaults to the current time.
   * @param {number} [controls.horizonDays=7] Integer 1..31, counting local calendar dates.
   * @param {number} [controls.maxSessionMinutes=90] Positive integer session-length limit.
   * @param {number} [controls.extraMinutes=0] One of 0, 30, 60; used by the what-if policy.
   * @returns {Object} Context with tasks, availability, commitments, now, horizonEnd,
   *   horizonDays, maxSessionMinutes, extraMinutes and ruleVersion. Time fields and
   *   commitment boundaries are Date values; task deadlines retain the caller's representation.
   * @throws {TypeError} Explicit validation failure for tasks, dates, windows, commitments
   *   or controls. Structurally malformed nested records can also cause native TypeError.
   * @remarks No storage or network access. Copies known task/window/commitment structures;
   *   it does not promise a deep clone of arbitrary extra nested caller fields.
   */
  function identifySchedulingConstraints(profile, controls = {}) {
    if (!profile || typeof profile !== 'object') throw new TypeError('profile: required');
    validateTasks(profile.tasks);
    const now = date(controls.now ?? new Date(), 'now');
    const horizonDays = controls.horizonDays ?? DEFAULTS.horizonDays;
    const maxSessionMinutes = controls.maxSessionMinutes ?? DEFAULTS.maxSessionMinutes;
    const extraMinutes = controls.extraMinutes ?? 0;
    if (!Number.isInteger(horizonDays) || horizonDays < 1 || horizonDays > 31) throw new TypeError('horizonDays: must be 1–31');
    if (!Number.isInteger(maxSessionMinutes) || maxSessionMinutes < 1) throw new TypeError('maxSessionMinutes: expected positive integer');
    if (![0, 30, 60].includes(extraMinutes)) throw new TypeError('extraMinutes: expected 0, 30 or 60');
    if (!profile.availability || typeof profile.availability !== 'object') throw new TypeError('availability: required');
    const availability = {};
    for (let day = 0; day < 7; day++) {
      const windows = profile.availability[day] ?? [];
      if (!Array.isArray(windows)) throw new TypeError('availability: expected daily window array');
      availability[day] = windows.map(window => {
        if (!Array.isArray(window) || window.length !== 2 || clockMinutes(window[0]) >= clockMinutes(window[1])) throw new TypeError('availability: start must precede end');
        return [...window];
      });
    }
    if (profile.commitments != null && !Array.isArray(profile.commitments)) throw new TypeError('commitments: expected array');
    const commitments = (profile.commitments ?? []).map(item => {
      const start = date(item.start, 'commitment.start'), end = date(item.end, 'commitment.end');
      if (end <= start) throw new TypeError('commitment: start must precede end');
      return {...item, start, end};
    });
    const horizonEnd = new Date(now);
    horizonEnd.setHours(0, 0, 0, 0);
    horizonEnd.setDate(horizonEnd.getDate() + horizonDays);
    return {tasks: profile.tasks.map(task => ({...task})), availability, commitments,
      now, horizonEnd, horizonDays, maxSessionMinutes, extraMinutes, ruleVersion: RULE_VERSION};
  }

  /** F.1.5.2; remove fixed commitments using half-open [start, end) intervals. */
  function subtractIntervals(start, end, commitments) {
    let pieces = [[date(start, 'start'), date(end, 'end')]];
    for (const item of commitments) {
      const cs = date(item.start, 'commitment.start'), ce = date(item.end, 'commitment.end');
      pieces = pieces.flatMap(([a, b]) => ce <= a || cs >= b ? [[a, b]]
        : [[a, new Date(Math.max(+a, +cs))], [new Date(Math.min(+b, +ce)), b]].filter(([x, y]) => y > x));
    }
    return pieces;
  }

  function mergeIntervals(intervals) {
    const sorted = intervals.slice().sort((a, b) => a.start - b.start), merged = [];
    for (const item of sorted) {
      const last = merged[merged.length - 1];
      if (last && item.start <= last.end) last.end = new Date(Math.max(+last.end, +item.end));
      else merged.push({start: new Date(item.start), end: new Date(item.end)});
    }
    return merged;
  }

  /**
   * F.1.5.2 Determine Available Study Slots
   * Requirement: CR-2; system source: 1.4.5.
   * Model mechanism: C.2.5.2 (entity 281611).
   * Model I: Scheduling Constraints. Model O: Available Study Slots.
   * Implementation I: validated constraints from identifySchedulingConstraints.
   * Implementation C: local calendar dates, reference time rounded up to a whole minute,
   *   half-open intervals, and optional extra window ending at 21:30.
   * Implementation O: merged windows with fixed commitments subtracted.
   * M: C.2.5.2 Study Slot Identification Module; pure JavaScript interval logic.
   *
   * @param {Object} constraints Context returned by identifySchedulingConstraints.
   * @returns {Array<{start: Date, end: Date}>} Available intervals in chronological order.
   * @precondition Use validated constraints; availability must contain weekday arrays 0..6.
   * @throws {TypeError} Invalid HH:mm strings detected by clockMinutes, or native errors
   *   on malformed context. This function does not independently revalidate the whole context.
   * @remarks Does not mutate the context; no storage, UI or external calendar transport.
   */
  function determineAvailableStudySlots(constraints) {
    const intervals = [], {now, horizonDays, availability, extraMinutes, commitments} = constraints;
    const earliest = new Date(Math.ceil(+now / MINUTE) * MINUTE);
    for (let offset = 0; offset < horizonDays; offset++) {
      const day = new Date(now);
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() + offset);
      const windows = availability[day.getDay()].map(([start, end]) => [clockMinutes(start), clockMinutes(end)]);
      // Same window as the application's Apply scenario path: ends at 21:30.
      if (extraMinutes) windows.push([21 * 60 + 30 - extraMinutes, 21 * 60 + 30]);
      for (const [startMinute, endMinute] of windows) {
        const start = new Date(day), end = new Date(day);
        start.setMinutes(startMinute);
        end.setMinutes(endMinute);
        const clipped = new Date(Math.max(+start, +earliest));
        if (end > clipped) intervals.push({start: clipped, end});
      }
    }
    // Normalize overlap before allocation, so added/repeated windows cannot double-book.
    return mergeIntervals(intervals).flatMap(item => subtractIntervals(item.start, item.end, commitments)
      .map(([start, end]) => ({start, end})));
  }

  /**
   * F.1.5.3 Allocate Prioritized Tasks
   * Requirement: CR-3; system source: 1.4.5.
   * Model mechanism: C.2.5.3 (entity 281612).
   * Model I: Available Study Slots. Model O: Proposed Study Sessions.
   * Implementation I: ranked tasks, available intervals and retained constraints.
   * Implementation C: supplied task order, deadlines, maximum session length and whole minutes.
   * Implementation O: proposed blocks plus unscheduled minutes by task.
   * M: C.2.5.3 Task Allocation Module; pure JavaScript greedy allocation.
   * Model qualification: prioritizedTasks and constraints are explicit implementation
   *   context; no additional native XML input arrow is asserted by these parameters.
   *
   * @param {Array<Object>} prioritizedTasks RankedTask records with remaining minutes;
   *   normally produced by calculateTaskPriorities with the same reference time.
   * @param {Array<{start: Date, end: Date}>} availableSlots Ordered, non-overlapping,
   *   commitment-free intervals produced by determineAvailableStudySlots.
   * @param {Object} constraints Validated context, including all tasks and reference time.
   * @returns {{blocks: Array<Object>, shortfalls: Array<Object>}} Blocks contain taskId,
   *   name, start/end Date values, duration in minutes and status. Shortfalls contain
   *   taskId, name and positive minutes, including unfinished tasks already overdue.
   * @precondition Inputs come from the validated pipeline; remaining work and limits
   *   are valid integers. This function performs no complete independent input validation.
   * @remarks Uses local cursors rather than changing caller slots. No deliberate domain
   *   exceptions are thrown; malformed inputs can cause native errors or invalid output.
   *   Greedy-policy shortfall is not proof that no alternative allocation could fit.
   */
  function allocatePrioritizedTasks(prioritizedTasks, availableSlots, constraints) {
    const open = availableSlots.map(slot => ({...slot, cursor: new Date(slot.start)}));
    const blocks = [], shortfalls = [];
    for (const task of prioritizedTasks) {
      let left = task.remaining;
      for (const slot of open) {
        const limit = Math.min(+slot.end, +new Date(task.deadline));
        while (left > 0 && +slot.cursor < limit) {
          const possible = Math.floor((limit - +slot.cursor) / MINUTE);
          if (possible < 1) break;
          const duration = Math.min(constraints.maxSessionMinutes, left, possible);
          const start = new Date(slot.cursor), end = new Date(+start + duration * MINUTE);
          blocks.push({taskId: task.id, name: task.name, start, end, duration, status: task.status});
          slot.cursor = end;
          left -= duration;
        }
        if (!left) break;
      }
      if (left) shortfalls.push({taskId: task.id, name: task.name, minutes: left});
    }
    for (const task of constraints.tasks) {
      if (remaining(task) > 0 && +new Date(task.deadline) <= +constraints.now)
        shortfalls.push({taskId: task.id, name: task.name, minutes: remaining(task)});
    }
    blocks.sort((a, b) => a.start - b.start);
    return {blocks, shortfalls};
  }

  /**
   * F.1.5.4 Evaluate Schedule Feasibility
   * Requirement: CR-4; system source: 1.4.5.
   * Model mechanism: C.2.5.4 (entity 281613).
   * Model I: Proposed Study Sessions. Model O: Feasibility Assessment.
   * Implementation I: proposal plus retained constraints and available intervals.
   * Implementation C: time boundaries, session limit, task ownership, non-overlap
   *   and conservation of remaining workload.
   * Implementation O: valid, feasible, issues and unscheduledMinutes.
   * M: C.2.5.4 Schedule Feasibility Evaluation Module; pure JavaScript assessment.
   * Model qualification: accompanying context is a code detail, not an invented XML arrow.
   *
   * @param {{blocks: Array<Object>, shortfalls: Array<Object>}} proposal Candidate result.
   * @param {Object} constraints Validated planning context with tasks and Date boundaries.
   * @param {Array<{start: Date, end: Date}>} availableSlots Validated available intervals.
   * @returns {{valid: boolean, feasible: boolean, issues: Array<string>, unscheduledMinutes: number}}
   *   valid means no detected violations; feasible additionally requires no shortfalls.
   * @precondition Containers and context have the pipeline's expected structure.
   * @remarks Returns issues for supported semantic violations rather than throwing a
   *   domain exception. Malformed containers can cause native errors; it is not a complete
   *   schema validator. Does not mutate the proposal or prove global scheduling optimality.
   */
  function evaluateScheduleFeasibility(proposal, constraints, availableSlots) {
    const issues = [], totals = new Map(), tasks = new Map(constraints.tasks.map(task => [task.id, task]));
    const blocks = proposal.blocks.slice().sort((a, b) => a.start - b.start);
    let previousEnd = -Infinity;
    for (const block of blocks) {
      const task = tasks.get(block.taskId), start = +new Date(block.start), end = +new Date(block.end);
      if (!task || !remaining(task)) issues.push(`unknown or completed task: ${block.taskId}`);
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || !Number.isInteger(block.duration) || (end - start) / MINUTE !== block.duration || block.duration > constraints.maxSessionMinutes)
        issues.push(`invalid session: ${block.taskId}`);
      if (start < +constraints.now || end > +constraints.horizonEnd || (task && end > +new Date(task.deadline))) issues.push(`time boundary: ${block.taskId}`);
      if (!availableSlots.some(slot => start >= +slot.start && end <= +slot.end)) issues.push(`outside available slots: ${block.taskId}`);
      if (constraints.commitments.some(item => start < +item.end && end > +item.start)) issues.push(`commitment overlap: ${block.taskId}`);
      if (start < previousEnd) issues.push(`overlapping session: ${block.taskId}`);
      previousEnd = Math.max(previousEnd, end);
      totals.set(block.taskId, (totals.get(block.taskId) || 0) + block.duration);
    }
    const unscheduled = new Map();
    for (const item of proposal.shortfalls) {
      if (!tasks.has(item.taskId) || unscheduled.has(item.taskId) || !Number.isInteger(item.minutes) || item.minutes <= 0) issues.push(`invalid shortfall: ${item.taskId}`);
      unscheduled.set(item.taskId, item.minutes);
    }
    for (const task of constraints.tasks)
      if ((totals.get(task.id) || 0) + (unscheduled.get(task.id) || 0) !== remaining(task)) issues.push(`workload mismatch: ${task.id}`);
    return {valid: issues.length === 0, feasible: issues.length === 0 && proposal.shortfalls.length === 0, issues,
      unscheduledMinutes: proposal.shortfalls.reduce((sum, item) => sum + item.minutes, 0)};
  }

  /**
   * F.1.5.5 Generate Feasible Study Plan
   * Requirement: CR-5; system source: 1.4.5.
   * Model mechanism: C.2.5.5 (entity 281614).
   * Model I: Feasibility Assessment.
   * Model C: Preserve saved data; Maintain traceability and scope (inherited controls).
   * Model O: Feasible Study Plan; Study Calendar Updates.
   * Implementation I: proposal and its corresponding assessment.
   * Implementation C: assessment.valid must be true before returning the plan.
   * Implementation O: blocks and shortfalls, consumed by internal plan/calendar views.
   * M: C.2.5.5 Study Plan Assembly Module; pure JavaScript assembly boundary.
   * Model qualification: proposal is retained code context. Internal blocks are not
   *   evidence that optional external Calendar transport has been implemented.
   *
   * @param {{blocks: Array<Object>, shortfalls: Array<Object>}} proposal Assessed proposal.
   * @param {{valid: boolean, feasible: boolean, issues: Array<string>, unscheduledMinutes: number}} assessment
   *   Result from evaluateScheduleFeasibility for this exact proposal and context.
   * @returns {{blocks: Array<Object>, shortfalls: Array<Object>}} New wrapper referring
   *   to the original proposal arrays; no cloning, persistence or external delivery.
   * @throws {Error} When assessment.valid is false: Invalid study plan with issue details.
   * @precondition Assessment matches the proposal. This function trusts that association
   *   and does not independently rerun feasibility checks or verify provenance.
   * @remarks A valid proposal with shortfalls is returned even when feasible is false.
   *   Additional parent-level implementation contributions: CR-7 (plan output), CR-8
   *   (internal calendar-update data) and CR-10 (retained taskId). These are not new model links.
   */
  function assembleStudyPlan(proposal, assessment) {
    if (!assessment.valid) throw new Error(`Invalid study plan: ${assessment.issues.join('; ')}`);
    // UI consumes the same blocks as calendar updates; no external calendar delivery.
    return {blocks: proposal.blocks, shortfalls: proposal.shortfalls};
  }

  /** F.1.5 / 1.4.5; compose all five component functions with one explicit clock snapshot. */
  function generateFeasibleStudyPlan(profile, controls = {}) {
    const constraints = identifySchedulingConstraints(profile, controls);
    const availableSlots = determineAvailableStudySlots(constraints);
    const prioritizedTasks = calculateTaskPriorities(constraints.tasks, constraints.now);
    const proposal = allocatePrioritizedTasks(prioritizedTasks, availableSlots, constraints);
    const assessment = evaluateScheduleFeasibility(proposal, constraints, availableSlots);
    return assembleStudyPlan(proposal, assessment);
  }

  return Object.freeze({RULE_VERSION, DEFAULTS, remaining, validateTasks, scoreTask,
    calculateTaskPriorities, identifySchedulingConstraints, subtractIntervals,
    determineAvailableStudySlots, allocatePrioritizedTasks, evaluateScheduleFeasibility,
    assembleStudyPlan, generateFeasibleStudyPlan});
});
