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
   * F.1.5.1 Identify Scheduling Constraints / C.2.5.1 / CR-1, CR-6.
   * I: profile and planning controls; C: now/horizon/session limit.
   * O: validated Scheduling Constraints; M: pure constraint module.
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

  /** F.1.5.2 / C.2.5.2 / CR-2; I: Scheduling Constraints; O: Available Study Slots. */
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

  /** F.1.5.3 / C.2.5.3 / CR-3; I: priorities and slots; O: Proposed Study Sessions. */
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
   * F.1.5.4 / C.2.5.4 / CR-4; I: proposal and constraints; O: Feasibility Assessment.
   * Checks availability, commitments, deadlines, session size, overlap, task ownership
   * and workload conservation; a shortfall is the result of this greedy policy.
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

  /** F.1.5.5 / C.2.5.5 / CR-5, CR-7, CR-8, CR-10; I: assessment; O: plan/calendar data. */
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
