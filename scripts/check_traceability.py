"""Check packaged XML relationships, implementation references and local contracts.

This checks consistency against an explicit model baseline, not requirement acceptance.
"""
import ast
import hashlib
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import unquote
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]


def main():
    matrix = json.loads((ROOT / 'docs/traceability.json').read_text())
    model = ROOT / matrix['model_file']
    assert hashlib.sha256(model.read_bytes()).hexdigest() == matrix['model_sha256'], 'Model baseline fingerprint changed'
    xml = ET.parse(model).getroot()
    entities = {e.findtext('globalId'): e for e in xml.iter('entity')}
    by_id = {e.get('id'): g for g, e in entities.items()}
    relation_names = {r.get('id'): r.findtext('name') for r in xml.find('schema').findall('schemaRelation')}
    edges = {(r.findtext('sourceId'), relation_names[r.findtext('schemaRelationId')], r.findtext('targetId')) for r in xml.iter('relationship')}
    parent = next(g for g, e in entities.items() if e.findtext('number') == 'F.1.5')
    tree = ast.parse((ROOT / 'tests/test_functional_requirements.py').read_text())
    cases = next(ast.literal_eval(n.value) for n in tree.body if isinstance(n, ast.Assign)
                 and any(isinstance(t, ast.Name) and t.id == 'CASES' for t in n.targets))
    js_cases = ROOT / 'tests/js_cases.cjs'
    exported = json.loads(subprocess.check_output(['node', '-e', 'console.log(JSON.stringify(Object.keys(require(process.argv[1]))))', str(js_cases)], text=True))
    assert len(cases) == len(set(cases)) and set(cases) == set(exported), 'Python and JS cases disagree'
    markdown = (ROOT / 'docs/traceability.md').read_text()
    assert len(matrix['function_entries']) == 5
    for row in matrix['function_entries']:
        f, c, q = (by_id[row[key]] for key in ('function_entity_id', 'component_entity_id', 'requirement_entity_id'))
        assert entities[f].findtext('number') == row['function_id']
        assert entities[f].findtext('name') == row['function_name']
        assert entities[c].findtext('number') == row['component_id']
        assert entities[q].findtext('number') == row['requirement_id']
        assert (f, 'decomposes', parent) in edges and (f, 'performed by', c) in edges
        assert (q, 'satisfied by', c) in edges
        assert any(a == q and b == 'traced from' and entities[t].findtext('number') == row['source_requirement_id'] for a, b, t in edges)
        source = (ROOT / row['module']).read_text()
        assert f"function {row['symbol']}(" in source.splitlines()[row['line'] - 1]
        assert all(t in cases for t in row['tests'])
        assert row['symbol'] in markdown and all(t in markdown for t in row['tests'])
    cr_rows = matrix['component_requirements']
    actual_cr_ids = {e.get('id') for e in entities.values() if re.fullmatch(r'CR-\d+', e.findtext('number', ''))}
    assert {r['entity_id'] for r in cr_rows} == actual_cr_ids and len(cr_rows) == 18
    for row in cr_rows:
        g = by_id[row['entity_id']]
        assert entities[g].findtext('number') == row['requirement_id']
        assert sorted(entities[t].findtext('number') for a, b, t in edges if a == g and b == 'traced from') == row['traced_from']
        assert sorted(entities[t].get('id') for a, b, t in edges if a == g and b == 'satisfied by') == row['satisfied_by_entity_ids']
    test_map = json.loads((ROOT / 'docs/test-requirement-map.json').read_text())
    assert len(test_map) == len(cases) and {r['test'] for r in test_map} == set(cases)
    for row in test_map:
        assert row['test'] in (ROOT / 'docs/test-requirement-map.md').read_text()
        assert set(row['requirement_ids']) == set(row['requirement_entity_ids'])
        for number, entity_id in row['requirement_entity_ids'].items():
            assert entities[by_id[entity_id]].findtext('number') == number
    contract = json.loads((ROOT / 'contracts/api-v1.yaml').read_text())
    assert contract['openapi'] == '3.0.3' and contract['paths'] == {}
    schemas = contract['components']['schemas']
    def refs(value):
        if isinstance(value, dict):
            if '$ref' in value:
                assert value['$ref'].startswith('#/components/schemas/')
                assert value['$ref'].rsplit('/', 1)[1] in schemas
            for child in value.values():
                refs(child)
        elif isinstance(value, list):
            for child in value:
                refs(child)
    refs(contract)
    operations = contract['x-local-operations']
    assert len(operations) == len({r['operationId'] for r in operations}) == 9
    for operation in operations:
        source = (ROOT / operation['module']).read_text()
        signature = re.search(r'function\s+' + re.escape(operation['operationId']) + r'\(([^)]*)\)', source)
        assert signature, operation['operationId']
        params = [p.split('=')[0].strip() for p in signature[1].split(',')]
        assert params == operation['parameters'] == list(operation['parameterContracts'])
        assert operation['preconditions'] and operation['errors']
        subprocess.run(['node', '-e', "if(typeof require(process.argv[1])[process.argv[2]]!=='function')process.exit(1)", str(ROOT / operation['module']), operation['operationId']], check=True)
    html = (ROOT / 'Study Flow/studyflow_demo.html').read_text()
    scripts = re.findall(r'<script src="([^"]+)"', html)
    assert scripts == ['js/planning.js', 'js/storage.js', 'js/app.js']
    for script in scripts:
        assert (ROOT / 'Study Flow' / script).is_file()
    for target in ['dashboard', 'tasks', 'availability', 'plan', 'requirements']:
        assert f'id="{target}"' in html
        assert f'#{target}' in (ROOT / 'docs/route-table.md').read_text()
    links = 0
    for doc in [ROOT / 'README.md', *sorted((ROOT / 'docs').glob('*.md'))]:
        for url in re.findall(r'\]\(([^)]+)\)', doc.read_text()):
            if '://' in url or url.startswith('#'):
                continue
            file, _, anchor = unquote(url).partition('#')
            target = (doc.parent / file).resolve()
            assert target.is_relative_to(ROOT), ('External dependency', doc, url)
            assert target.is_file(), ('Missing local link', doc, url)
            if re.fullmatch(r'L\d+', anchor):
                assert 1 <= int(anchor[1:]) <= len(target.read_text().splitlines())
            links += 1
    print(f'PASS: 5 native function allocations; 18 CR source/allocation rows; {len(cases)} mapped tests; 9 local operations; {links} portable links.')
    print('Scope: baseline/reference consistency only; not full schema conformance or requirement acceptance.')


if __name__ == '__main__':
    main()
