import re

with open("e:/AI_Playground/mario/js/tilemap.js", "r", encoding="utf-8") as f:
    content = f.read()

# 1-2のマップの Y=9 の行から C を消す
match = re.search(r'const rawMap1_2 = \[\n(.*?)\n    \];', content, re.DOTALL)
if match:
    map_str = match.group(1)
    lines = map_str.strip().split("\n")
    # Y=9 はインデックス 9
    line_y9 = lines[9]
    if 'C' in line_y9:
        # C を . に置き換え
        lines[9] = line_y9.replace('C', '.')
    
    new_map_str = "\n".join(lines)
    content = content.replace(map_str, new_map_str)

with open("e:/AI_Playground/mario/js/tilemap.js", "w", encoding="utf-8") as f:
    f.write(content)

print("1-2 direct placement (C at Y=9) fixed.")
