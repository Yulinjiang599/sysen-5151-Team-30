/**
 * Browser storage adapter. Model: F.1.1/F.1.6; requirements SR-03, SR-06, SR-10.
 * I: app state; C: caller-supplied Storage and migration/validation functions.
 * O: restored state or an explicit save error; M: browser localStorage in the UI,
 * in-memory Storage in tests. Demo profiles share an origin; no authentication.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.StudyFlowStorage = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const KEY = 'studyflow_demo_v3';
  /** SR-06: restore the same saved JSON; fallback is supplied by the application. */
  function loadState(storage, fallback, migrate = value => value) {
    try {
      const value = storage.getItem(KEY);
      return value == null ? migrate(fallback()) : migrate(JSON.parse(value));
    } catch (error) {
      return migrate(fallback());
    }
  }
  /** SR-03/SR-06: propagate write errors; callers must not report save success. */
  function saveState(storage, state) {
    storage.setItem(KEY, JSON.stringify(state));
    return state;
  }
  return Object.freeze({KEY, loadState, saveState});
});
