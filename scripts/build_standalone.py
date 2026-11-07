"""Produce a portable HTML containing the same three tested JavaScript modules."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "Study Flow"


def build():
    html = (APP / "studyflow_demo.html").read_text(encoding="utf-8")
    for name in ("planning.js", "storage.js", "app.js"):
        tag = f'<script src="js/{name}"></script>'
        if html.count(tag) != 1:
            raise ValueError(f"Expected exactly one reference to {name}")
        script = (APP / "js" / name).read_text(encoding="utf-8")
        script = re.sub(r"</script", r"<\\/script", script, flags=re.I)
        html = html.replace(tag, "<script>\n" + script + "\n</script>")
    target = ROOT / "build" / "StudyFlow-3.0-fixed-standalone.html"
    target.parent.mkdir(exist_ok=True)
    target.write_text(html, encoding="utf-8")
    print(target)


if __name__ == "__main__":
    build()
