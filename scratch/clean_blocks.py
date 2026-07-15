import re

def clean_map(map_str, width):
    lines = map_str.strip().split("\n")
    # 各行から文字列だけ抽出
    grid = []
    prefix = []
    suffix = []
    for line in lines:
        match = re.search(r'(.*?)"(.*)"(.*)', line)
        if match:
            prefix.append(match.group(1) + '"')
            grid.append(list(match.group(2).ljust(width, '.')))
            suffix.append('"' + match.group(3))
            
    # 下層（Y=9, Y=10）に障害物（#, [, ], (, ) など）があるX座標を特定
    obstacle_x = set()
    for y in range(len(grid)):
        if y >= 8: # Y=8〜10をチェック (階段や土管があるか)
            for x in range(width):
                char = grid[y][x]
                if char in ['#', '[', ']', '(', ')', '|']:
                    # ただし、アイテムブロックの可能性があるものは除外（Y=8にあるアイテムブロックなど）
                    # 下層の障害物だけを判定したい
                    if y >= 9:
                        obstacle_x.add(x)

    # 上層（Y=4〜Y=8）のアイテムブロックをチェック
    for y in range(len(grid)):
        if y <= 8:
            for x in range(width):
                char = grid[y][x]
                if char in ['?', 'C', '#']:
                    # 障害物の上空にある場合、消去する
                    # 少し余裕を見て、x-1からx+1に障害物があれば消す
                    has_obstacle = False
                    for dx in [-1, 0, 1]:
                        if (x + dx) in obstacle_x:
                            has_obstacle = True
                            break
                    if has_obstacle:
                        grid[y][x] = '.'
                        
    # 再構築
    new_lines = []
    for i in range(len(grid)):
        s = "".join(grid[i])
        new_lines.append(prefix[i] + s + suffix[i])
        
    return "\n".join(new_lines)

with open("e:/AI_Playground/mario/js/tilemap.js", "r", encoding="utf-8") as f:
    content = f.read()

# 1-1
match1 = re.search(r'const rawMap1_1 = \[\n(.*?)\n    \];', content, re.DOTALL)
if match1:
    map_str1 = match1.group(1)
    cleaned1 = clean_map(map_str1, 220)
    content = content.replace(map_str1, cleaned1)

# 1-2
match2 = re.search(r'const rawMap1_2 = \[\n(.*?)\n    \];', content, re.DOTALL)
if match2:
    map_str2 = match2.group(1)
    cleaned2 = clean_map(map_str2, 240)
    content = content.replace(map_str2, cleaned2)

with open("e:/AI_Playground/mario/js/tilemap.js", "w", encoding="utf-8") as f:
    f.write(content)

print("Blocks above obstacles removed.")
