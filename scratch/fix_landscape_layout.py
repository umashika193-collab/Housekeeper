import re

with open("e:/AI_Playground/mario/style.css", "r", encoding="utf-8") as f:
    content = f.read()

# 1. aspect-ratio の修正
content = content.replace("aspect-ratio: 512/448;", "aspect-ratio: 4/3;")

# 2. スマホ横画面用メディアクエリの修正
# #app-container と #arcade-cabinet を変更し、常に中央に 4:3 を維持するようにする
old_landscape_app_container = """  #app-container {
    height: 100vh;
    height: 100dvh;
    display: block; /* gridやflexを解除してフルスクリーン化 */
  }"""

new_landscape_app_container = """  #app-container {
    height: 100vh;
    height: 100dvh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #000;
  }"""

old_landscape_arcade_cabinet = """  #arcade-cabinet {
    border: none;
    border-radius: 0;
    padding: 0;
    box-shadow: none;
    width: 100vw;
    height: 100dvh;
    background: #000;
  }"""

new_landscape_arcade_cabinet = """  #arcade-cabinet {
    border: none;
    border-radius: 0;
    padding: 0;
    box-shadow: none;
    height: 100dvh;
    width: calc(100dvh * 4 / 3);
    max-width: 100vw;
    background: #000;
    margin: 0 auto;
    position: relative;
  }"""

content = content.replace(old_landscape_app_container, new_landscape_app_container)
content = content.replace(old_landscape_arcade_cabinet, new_landscape_arcade_cabinet)

# 3. 仮想コントローラーのボタン透過度を不透明(1.0)にする
# 先ほど追加した .d-pad-area, .action-area { opacity: 0.65; } を変更する
content = content.replace("opacity: 0.65;", "opacity: 1.0;")

# さらに念のため、横画面メディアクエリ内でも .d-pad-area, .action-area を強制固定
append_css = """
  #virtual-controller {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100dvh;
    pointer-events: none;
    z-index: 100;
  }
  .d-pad-area, .action-area {
    pointer-events: auto;
    position: absolute;
    bottom: 20px;
    opacity: 1.0;
  }
  .d-pad-area {
    left: 20px;
  }
  .action-area {
    right: 20px;
  }
"""
# "transform-origin: bottom right;\n  }\n}" の前に追加する
content = re.sub(r"transform-origin: bottom right;\n  }\n}", r"transform-origin: bottom right;\n  }" + append_css + "\n}", content)


with open("e:/AI_Playground/mario/style.css", "w", encoding="utf-8") as f:
    f.write(content)

print("CSS landscape layout fixed.")
