import re

# 1. Update style.css
with open("e:/AI_Playground/mario/style.css", "r", encoding="utf-8") as f:
    css_content = f.read()

# .action-btn のサイズ変更 (45px -> 55px)
css_content = re.sub(r"\.action-btn \{\s*position: absolute;\s*width: 45px;\s*height: 45px;", 
                     ".action-btn {\n  position: absolute;\n  width: 55px;\n  height: 55px;", 
                     css_content)

# 位置の調整 (隙間をなくす)
old_positions = """/* SFCカラー定義 */
.action-btn.x { top: 0; left: 48px; background: #00387b; } /* 青 */
.action-btn.y { top: 48px; left: 0; background: #009b45; } /* 緑 */
.action-btn.b { bottom: 0; left: 48px; background: #f3b604; } /* 黄 */
.action-btn.a { top: 48px; right: 0; background: #e10b1a; } /* 赤 */"""

new_positions = """/* SFCカラー定義 */
.action-btn.x { top: 0; left: 42px; background: #00387b; } /* 青 */
.action-btn.y { top: 42px; left: 0; background: #009b45; } /* 緑 */
.action-btn.b { bottom: 0; left: 42px; background: #f3b604; } /* 黄 */
.action-btn.a { top: 42px; right: 0; background: #e10b1a; } /* 赤 */"""

css_content = css_content.replace(old_positions, new_positions)

with open("e:/AI_Playground/mario/style.css", "w", encoding="utf-8") as f:
    f.write(css_content)


# 2. Update input.js
with open("e:/AI_Playground/mario/js/input.js", "r", encoding="utf-8") as f:
    js_content = f.read()

old_touch_code = """    // ボタン要素にタッチイベントを一括登録
    Object.keys(keyMap).forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (!btn) return;

      const code = keyMap[btnId];

      const handlePress = (e) => {
        e.preventDefault(); // スクロール等のデフォルト動作を抑制
        this.keys[code] = true;
        btn.classList.add('active'); // 押下時の見た目を適用
      };

      const handleRelease = (e) => {
        e.preventDefault();
        this.keys[code] = false;
        btn.classList.remove('active');
      };

      // タッチイベントのバインド
      btn.addEventListener('touchstart', handlePress, { passive: false });
      btn.addEventListener('touchend', handleRelease, { passive: false });
      btn.addEventListener('touchcancel', handleRelease, { passive: false });

      // PC上でマウスクリックでもデバッグできるように一応対応
      btn.addEventListener('mousedown', handlePress);
      btn.addEventListener('mouseup', handleRelease);
      btn.addEventListener('mouseleave', handleRelease);
    });"""

new_touch_code = """    // スマホのスライド操作（YからBへ指を滑らせる等）に対応するため、
    // 仮想コントローラー全体でタッチ位置を常に監視し、指の下にあるボタンを判定する
    const handleTouches = (e) => {
      e.preventDefault();
      
      // まず全仮想ボタンの入力をリセット
      Object.values(keyMap).forEach(code => {
        this.keys[code] = false;
      });
      Object.keys(keyMap).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) btn.classList.remove('active');
      });

      // 現在画面に触れている全ての指の座標から対象ボタンを判定
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (element) {
          // 触れている要素がボタン、またはボタン内のテキスト(label)なら最も近いボタンを取得
          const targetBtn = element.closest('.action-btn, .d-btn');
          
          if (targetBtn && keyMap[targetBtn.id]) {
            const code = keyMap[targetBtn.id];
            this.keys[code] = true;
            targetBtn.classList.add('active');
          }
        }
      }
    };

    // 仮想コントローラー領域全体にイベントをバインド
    virtualController.addEventListener('touchstart', handleTouches, { passive: false });
    virtualController.addEventListener('touchmove', handleTouches, { passive: false });
    virtualController.addEventListener('touchend', handleTouches, { passive: false });
    virtualController.addEventListener('touchcancel', handleTouches, { passive: false });

    // PCデバッグ用のマウスイベント（マウスは1点のみなのでシンプルに）
    let isMouseDown = false;
    const handleMouse = (e) => {
      if (!isMouseDown && e.type !== 'mousedown') return;
      if (e.type === 'mousedown') isMouseDown = true;
      if (e.type === 'mouseup' || e.type === 'mouseleave') {
        isMouseDown = false;
        // マウスを離したら全てリセット
        Object.values(keyMap).forEach(code => this.keys[code] = false);
        Object.keys(keyMap).forEach(btnId => {
          const btn = document.getElementById(btnId);
          if (btn) btn.classList.remove('active');
        });
        return;
      }
      
      // mousemove または mousedown の処理
      // (PCでもドラッグでボタン間を移動できるようにする)
      Object.values(keyMap).forEach(code => this.keys[code] = false);
      Object.keys(keyMap).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) btn.classList.remove('active');
      });

      const element = document.elementFromPoint(e.clientX, e.clientY);
      if (element) {
        const targetBtn = element.closest('.action-btn, .d-btn');
        if (targetBtn && keyMap[targetBtn.id]) {
          const code = keyMap[targetBtn.id];
          this.keys[code] = true;
          targetBtn.classList.add('active');
        }
      }
    };

    virtualController.addEventListener('mousedown', handleMouse);
    virtualController.addEventListener('mousemove', handleMouse);
    virtualController.addEventListener('mouseup', handleMouse);
    virtualController.addEventListener('mouseleave', handleMouse);"""

js_content = js_content.replace(old_touch_code, new_touch_code)

with open("e:/AI_Playground/mario/js/input.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print("Input JS and Style CSS updated for Proposal A.")
