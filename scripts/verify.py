"""Run the same bounded verification steps locally or in GitHub Actions."""
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import platform
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]


def main():
    evidence = ROOT / 'evidence'
    evidence.mkdir(exist_ok=True)
    steps = [('JavaScript syntax: ' + path, ['node', '--check', path]) for path in
             ['Study Flow/js/planning.js', 'Study Flow/js/storage.js', 'Study Flow/js/app.js', 'tests/js_cases.cjs']]
    steps += [('Native model / code / test / contract references', [sys.executable, 'scripts/check_traceability.py']),
              ('Requirement-named unittest suite', [sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-v']),
              ('Portable HTML assembly', [sys.executable, 'scripts/build_standalone.py'])]
    report = {'started_at_utc': datetime.now(timezone.utc).isoformat(),
              'execution_context': 'github-actions' if os.environ.get('GITHUB_ACTIONS') == 'true' else 'local',
              'python': platform.python_version(), 'platform': platform.platform(),
              'timezone_for_tests': 'America/New_York', 'steps': [],
              'limits': 'Local evidence is not a remote CI pass. No rendered browser or complete acceptance testing.'}
    try:
        report['node'] = subprocess.check_output(['node', '--version'], text=True).strip()
    except (OSError, subprocess.SubprocessError):
        report['node'] = 'unavailable'
    sources = [ROOT / 'README.md', ROOT / '.github/workflows/verify.yml']
    for folder in ['Study Flow', 'contracts', 'docs', 'tests', 'scripts', 'model']:
        sources.extend(p for p in (ROOT / folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
    report['files_sha256'] = {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(sources)}
    env = {**os.environ, 'TZ': 'America/New_York', 'PYTHONDONTWRITEBYTECODE': '1'}
    exit_code = 0
    with (evidence / 'verification.log').open('w') as log:
        for name, command in steps:
            start = time.monotonic()
            try:
                run = subprocess.run(command, cwd=ROOT, env=env, capture_output=True, text=True, timeout=120)
                code, output = run.returncode, run.stdout + run.stderr
            except (OSError, subprocess.TimeoutExpired) as error:
                code, output = 1, str(error)
            record = {'name': name, 'command': command, 'returncode': code, 'duration_seconds': round(time.monotonic() - start, 4)}
            report['steps'].append(record)
            log.write('\n## ' + name + '\n' + output + '\n')
            print(('PASS ' if code == 0 else 'FAIL ') + name)
            if code:
                print(output)
                exit_code = 1
                break
    report['status'] = 'passed' if exit_code == 0 else 'failed'
    report['finished_at_utc'] = datetime.now(timezone.utc).isoformat()
    (evidence / 'ci-summary.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f"{report['execution_context']}: {report['status']}; evidence/ci-summary.json")
    return exit_code


if __name__ == '__main__':
    sys.exit(main())
