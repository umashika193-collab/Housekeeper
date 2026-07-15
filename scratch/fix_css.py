import re

with open("e:/AI_Playground/mario/style.css", "r", encoding="utf-8") as f:
    content = f.read()

old_block = """.pwa-icon-container {
  display: flex;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
  margin-bottom: 12px;
}

  box-shadow: 0 0 15px rgba(0, 210, 255, 0.4);
}"""

new_block = """.pwa-icon-container {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
  width: 64px;
  height: 64px;
  margin: 0 auto 12px auto;
}

.pwa-app-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
}"""

content = content.replace(old_block, new_block)

with open("e:/AI_Playground/mario/style.css", "w", encoding="utf-8") as f:
    f.write(content)

print("CSS fixed.")
