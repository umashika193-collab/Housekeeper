import re

with open("e:/AI_Playground/mario/style.css", "r", encoding="utf-8") as f:
    content = f.read()

# @keyframes blink の後に追加する
version_css = """
.version-display {
  position: absolute;
  bottom: 10px;
  right: 15px;
  font-family: var(--font-pixel);
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  text-shadow: 1px 1px 2px #000;
  pointer-events: none;
}
"""

content = re.sub(r"(@keyframes blink \{\s*0%, 100% \{ opacity: 1; \}\s*50% \{ opacity: 0; \}\s*\})", r"\1\n" + version_css, content)

with open("e:/AI_Playground/mario/style.css", "w", encoding="utf-8") as f:
    f.write(content)

print("Version CSS added.")
