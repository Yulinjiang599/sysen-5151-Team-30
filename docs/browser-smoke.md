# Rendered-browser smoke check

One real ChatGPT in-app browser session exercised initial load/navigation, synthetic task creation, workload edit, addition of availability, invalid-window rejection, refresh, profile selection, closing/reopening the tab, calendar/agenda, requirements display and regeneration.

Actual sequence: a 60-minute synthetic task produced 300 minutes total shortfall; changing it to 120 minutes produced 360 minutes; adding Sunday 09:00–11:00 reduced shortfall to 240 minutes and added corresponding visible study blocks. Saved task/window information survived refresh and one close/reopen sequence in the same browser origin.

See [detailed observations](browser-evidence/14-真实浏览器检查.md), [machine-readable evidence](browser-evidence/browser-smoke.json), [calendar screenshot](browser-evidence/09-calendar.png) and [final agenda](browser-evidence/11-final-agenda.png).

## Limits and observations

- This is one in-app browser environment; no versioned two-browser acceptance or five independent recovery cases are established.
- Native deadline/completion/deletion changes, What-if Apply, import/export dialogs and timer remain untested here.
- The calendar truncates long titles in short blocks; Agenda displays full titles.
- Profile selection changes displayed records, but the UI wording “Private workspace loaded” is not proof of authenticated access.
- This smoke check does not resolve model boundary/CR-14/plan-confirmation gaps or establish remote CI success.
- Application source files were unchanged. Final packaging reruns local verification after documentation integration. The recorded execution context remains local; no remote run is implied.
