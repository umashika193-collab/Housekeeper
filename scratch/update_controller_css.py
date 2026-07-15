import re

with open("e:/AI_Playground/mario/style.css", "r", encoding="utf-8") as f:
    content = f.read()

# 基本スタイルの置換
old_base = """/* 仮想コントローラーの基本スタイル */
#virtual-controller {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 600px; /* モバイル画面幅の最大に合わせる */
  padding: 20px 10px;
  margin: 0 auto;
  user-select: none;
  -webkit-user-select: none;
  /* スマホの指が隠れないように、独自の専用領域として確保する */
  background: rgba(15, 12, 27, 0.95);
  border-top: 2px solid #2f275a;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 -5px 20px rgba(0,0,0,0.5);
  z-index: 100;
}

#virtual-controller.hidden {
  display: none !important;
}

/* D-Pad (十字キー) */
.d-pad-area {
  flex: 1;
  display: flex;
  justify-content: flex-start;
  padding-left: 20px;
}"""

new_base = """/* 仮想コントローラーの基本スタイル (画面両端へのオーバーレイ) */
#virtual-controller {
  display: flex;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* コンテナ自体はタッチ透過 */
  user-select: none;
  -webkit-user-select: none;
  z-index: 100;
}

#virtual-controller.hidden {
  display: none !important;
}

.d-pad-area, .action-area {
  pointer-events: auto; /* ボタン領域はタッチを受け付ける */
  position: absolute;
  bottom: 20px;
  opacity: 0.65;
}

/* D-Pad (十字キー) */
.d-pad-area {
  left: 20px;
}"""

content = content.replace(old_base, new_base)

# アクションエリアの基本スタイルの置換
old_action = """.action-area {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  padding-right: 20px;
}"""

new_action = """.action-area {
  right: 20px;
}"""

content = content.replace(old_action, new_action)


# メディアクエリ内の重複した #virtual-controller 設定の削除
# 964行目〜998行目あたりのオーバーレイ化コードはベーススタイルに統合されたので削除
media_query_virtual_controller = r"/\* 仮想コントローラーのオーバーレイ化 \*/.*?/\* ボタンを少し大きくして押しやすくする \*/"
content = re.sub(media_query_virtual_controller, r"/* ボタンを少し大きくして押しやすくする */", content, flags=re.DOTALL)

with open("e:/AI_Playground/mario/style.css", "w", encoding="utf-8") as f:
    f.write(content)

print("Virtual controller CSS updated to overlay style.")
