import re

with open("e:/AI_Playground/mario/js/tilemap.js", "r", encoding="utf-8") as f:
    content = f.read()

def fix_map_pole(map_str, width, pole_x, floor_y):
    lines = map_str.strip().split("\n")
    # 各行の末尾のカンマなどを処理するため、クオート内の文字列のみを抽出
    new_lines = []
    for i, line in enumerate(lines):
        match = re.search(r'"(.*)"', line)
        if match:
            s = match.group(1)
            # ポール文字(H, |)を一旦消す
            s = s.replace('H', '.').replace('|', '.')
            # 長さが足りない場合はドットで埋める
            if len(s) < width:
                s += '.' * (width - len(s))
            elif len(s) > width:
                s = s[:width]
                
            # ポールを描画 (高さは floor_y - 8 から floor_y - 1 まで、合計8ブロック)
            top_y = floor_y - 8
            if top_y <= i < floor_y:
                chars = list(s)
                if i == top_y:
                    chars[pole_x] = 'H'
                else:
                    chars[pole_x] = '|'
                s = "".join(chars)
                
            new_lines.append(f'      "{s}"' + ("," if i < len(lines)-1 else ""))
        else:
            new_lines.append(line)
            
    return "\n".join(new_lines)


# 1-1の修正
match1 = re.search(r'const rawMap1_1 = \[\n(.*?)\n    \];', content, re.DOTALL)
if match1:
    map_str1 = match1.group(1)
    fixed_map1 = fix_map_pole(map_str1, width=220, pole_x=214, floor_y=11)
    content = content.replace(map_str1, fixed_map1)

# 1-2の修正
match2 = re.search(r'const rawMap1_2 = \[\n(.*?)\n    \];', content, re.DOTALL)
if match2:
    map_str2 = match2.group(1)
    fixed_map2 = fix_map_pole(map_str2, width=240, pole_x=234, floor_y=11)
    content = content.replace(map_str2, fixed_map2)

with open("e:/AI_Playground/mario/js/tilemap.js", "w", encoding="utf-8") as f:
    f.write(content)

print("Poles fixed and doubled in height.")
