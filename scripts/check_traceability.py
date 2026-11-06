"""Check real model/code/test links and the local interface contract, without packages."""
import ast
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def main():
    matrix = json.loads((ROOT / "docs/traceability.json").read_text())
    tree = ast.parse((ROOT / matrix["test_file"]).read_text())
    assignments = [node for node in tree.body if isinstance(node, ast.Assign)]
    cases = next(ast.literal_eval(node.value) for node in assignments
                 if any(isinstance(target, ast.Name) and target.id == "CASES" for target in node.targets))
    js_cases = (ROOT / "tests/js_cases.cjs").read_text()
    markdown = (ROOT / "docs/traceability.md").read_text()
    ids = set()
    for entry in matrix["entries"]:
        source = (ROOT / entry["module"]).read_text()
        symbol = entry["symbol"]
        assert re.search(r"function\s+" + re.escape(symbol) + r"\(", source), entry
        assert entry["function_id"] in source, entry
        assert symbol in source.splitlines()[entry["line"] - 1], f"Stale line link: {entry}"
        assert entry["requirement_ids"] and entry["tests"], entry
        assert entry["function_id"] in markdown and symbol in markdown, entry
        assert entry["function_id"] not in ids, f"Duplicate function row: {entry}"
        ids.add(entry["function_id"])
        for test in entry["tests"]:
            assert test in cases and re.search(r"\b" + re.escape(test) + r"\(\)", js_cases), test
            assert test in markdown, test
    for suffix in range(1, 6):
        assert f"F.1.5.{suffix}" in ids
    for number in range(1, 19):
        assert re.search(r"^\| CR-" + str(number) + r" \|", markdown, re.M), f"Missing CR-{number}"
    for case in cases:
        assert re.search(r"\b" + re.escape(case) + r"\(\)", js_cases), case

    # JSON is a subset of YAML 1.2. The file is also a valid OpenAPI 3.0 document.
    contract = json.loads((ROOT / "contracts/api-v1.yaml").read_text())
    assert contract["openapi"] == "3.0.3"
    assert contract["paths"] == {}, "Do not advertise unimplemented HTTP routes"
    schemas = contract["components"]["schemas"]
    def check_refs(value):
        if isinstance(value, dict):
            if "$ref" in value:
                assert value["$ref"].startswith("#/components/schemas/")
                assert value["$ref"].split("/")[-1] in schemas, value
            for child in value.values():
                check_refs(child)
        elif isinstance(value, list):
            for child in value:
                check_refs(child)
    check_refs(contract)
    for operation in contract["x-local-operations"]:
        source = (ROOT / operation["module"]).read_text()
        signature = re.search(r"function\s+" + re.escape(operation["operationId"]) + r"\(([^)]*)\)", source)
        assert signature, operation
        params = [part.split("=")[0].strip() for part in signature[1].split(",") if part.strip()]
        assert params == operation["parameters"], operation
        module = operation["module"]
        check = "const m=require(process.argv[1]);if(typeof m[process.argv[2]]!=='function')process.exit(1)"
        subprocess.run(["node", "-e", check, str(ROOT / module), operation["operationId"]], check=True)

    html = (ROOT / "Study Flow/studyflow_demo.html").read_text()
    assert re.findall(r'<script src="([^"]+)"', html) == ["js/planning.js", "js/storage.js", "js/app.js"]
    for src in re.findall(r'<script src="([^"]+)"', html):
        assert (ROOT / "Study Flow" / src).is_file()
    for target in ["dashboard", "tasks", "availability", "plan", "requirements"]:
        assert f'id="{target}"' in html
        assert f"#{target}" in (ROOT / "docs/route-table.md").read_text()
    print(f"PASS: {len(ids)} function mappings, 18 CR rows, {len(cases)} real tests, "
          f"{len(contract['x-local-operations'])} local contracts and HTML dependencies.")


if __name__ == "__main__":
    main()
