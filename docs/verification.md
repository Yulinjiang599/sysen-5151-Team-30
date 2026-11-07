# Verification status

Run `python3 scripts/verify.py` from this package root. It checks JavaScript syntax, native model/code/test references, local interface signatures, 31 requirement-named unittest cases and standalone HTML assembly.

The runner writes `evidence/ci-summary.json` and `evidence/verification.log`, including execution context, source fingerprints and return codes. `execution_context=local` records local execution only. The GitHub Actions configuration in `.github/workflows/verify.yml` has not been uploaded or run for this working package.

This package intentionally contains a copy of the supplied native XML so automated model checks do not depend on the user's Desktop or Downloads paths. Changes to the model baseline require review; the source fingerprint check detects unrecorded changes.

## Limits

- A single rendered-browser smoke sequence now has [recorded evidence](browser-smoke.md), including refresh and one tab close/reopen. Other browser configurations, complete recovery cases, file dialogs and student pilots remain pending.
- Event harness tests execute actual app handlers and capture actual planning outputs, using a DOM double rather than a rendered browser.
- 12 scenarios × 3 repeats are tested; complete approved-rule/rationale coverage is not established.
- No authentication or complete cross-user access-control acceptance is claimed.
- CR-16 timing is a 250-task planning fixture against a draft bound, not end-to-end UI timing.
- Native XML relationship consistency, local test success and remote CI success are separate facts.
