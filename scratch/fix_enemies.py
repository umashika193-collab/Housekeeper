import re

with open("e:/AI_Playground/mario/js/game.js", "r", encoding="utf-8") as f:
    content = f.read()

# new window.Enemy(x, 332, 'mouse') などを new window.Enemy(x, 100, 'mouse') に変更する
content = re.sub(r'new window\.Enemy\(x,\s*332,\s*\'mouse\'\)', r"new window.Enemy(x, 100, 'mouse')", content)

with open("e:/AI_Playground/mario/js/game.js", "w", encoding="utf-8") as f:
    f.write(content)

print("Enemy spawn Y coordinate updated to 100.")
