import re

with open("e:/AI_Playground/mario/js/game.js", "r", encoding="utf-8") as f:
    content = f.read()

# 1. コンストラクタの最後に変数を追加
# コンストラクタは `this.resetGame();\n  }` で終わっているはずなのでそこを狙う
# あるいは `this.lastTime = 0;` 等を安全に追加するために、`class Game {` の下の `constructor` に追加する
constructor_end_pattern = r"    this\.resetGame\(\);\n  }"
constructor_end_replacement = """    this.resetGame();

    // 固定タイムステップ用
    this.lastTime = 0;
    this.accumulator = 0;
    this.STEP = 1000 / 60; // 60FPS
  }"""
content = re.sub(constructor_end_pattern, constructor_end_replacement, content)

# 2. loop メソッドの変更
old_loop = """  loop(timestamp) {
    // デルタタイムは使用せず、レトロゲームのように固定フレームレート(60fps)基準で動作
    this.update();
    this.draw();
    
    // キー入力更新 (previousKeysの書き換え用)
    window.Input.update();

    requestAnimationFrame((t) => this.loop(t));
  }"""

new_loop = """  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    let dt = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // タブがバックグラウンドに回った際の巨大なdtを防ぐ
    if (dt > 100) dt = 100;

    this.accumulator += dt;

    // 固定タイムステップ(16.6ms)ごとにupdateを呼び出す
    while (this.accumulator >= this.STEP) {
      this.update();
      this.accumulator -= this.STEP;
    }

    this.draw();
    
    // キー入力更新 (previousKeysの書き換え用)
    window.Input.update();

    requestAnimationFrame((t) => this.loop(t));
  }"""

content = content.replace(old_loop, new_loop)

with open("e:/AI_Playground/mario/js/game.js", "w", encoding="utf-8") as f:
    f.write(content)

print("game.js updated for fixed time step.")
