/**
 * キーボード入力を管理するクラス
 */
class InputHandler {
  constructor() {
    // 現在押されているキーの状態
    this.keys = {};
    
    // 前のフレームで押されていたキーの状態 (ジャンプの単押し検知などに使用)
    this.previousKeys = {};

    // イベントリスナーの登録
    window.addEventListener('keydown', (e) => {
      // 特定のゲーム操作キーはスクロールなどのデフォルト動作を防止
      const preventDefaultKeys = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (preventDefaultKeys.includes(e.code)) {
        e.preventDefault();
      }
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // モバイル用仮想コントローラーのセットアップ
    this.setupVirtualController();
  }

  /**
   * モバイルデバイスかどうかを簡易判定
   */
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.matchMedia && window.matchMedia("(max-width: 800px)").matches) ||
           ('ontouchstart' in window);
  }

  /**
   * 仮想コントローラーの初期化
   */
  setupVirtualController() {
    const virtualController = document.getElementById('virtual-controller');
    if (!virtualController) return;

    // タッチ環境なら表示
    if (this.isMobile()) {
      virtualController.classList.remove('hidden');
    }

    // 各仮想ボタンとキーコードの対応マッピング
    const keyMap = {
      'v-up': 'ArrowUp',
      'v-down': 'ArrowDown',
      'v-left': 'ArrowLeft',
      'v-right': 'ArrowRight',
      'v-a': 'Space',      // A(右)はジャンプ
      'v-b': 'Space',      // B(下)もジャンプ
      'v-x': 'ShiftLeft',  // X(上)はダッシュ/攻撃
      'v-y': 'ShiftLeft'   // Y(左)もダッシュ/攻撃
    };

    // スマホのスライド操作（YからBへ指を滑らせる等）に対応するため、
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
    virtualController.addEventListener('mouseleave', handleMouse);
  }

  /**
   * 毎フレームの終わりに呼び出し、キーの「前回の状態」を更新する
   */
  update() {
    this.previousKeys = { ...this.keys };
  }

  /**
   * 指定したキーが現在押されているか
   * @param {string} code - KeyboardEvent.code (例: 'ArrowLeft', 'Space')
   * @returns {boolean}
   */
  isDown(code) {
    return !!this.keys[code];
  }

  /**
   * 指定したキーが「このフレームで初めて押された」かどうか（トリガー検出）
   * @param {string} code - KeyboardEvent.code
   * @returns {boolean}
   */
  isPressed(code) {
    return !!this.keys[code] && !this.previousKeys[code];
  }

  // ユーティリティゲッター
  get moveLeft() {
    return this.isDown('ArrowLeft') || this.isDown('KeyA');
  }

  get moveRight() {
    return this.isDown('ArrowRight') || this.isDown('KeyD');
  }

  get jump() {
    return this.isDown('Space') || this.isDown('KeyZ') || this.isDown('KeyW') || this.isDown('ArrowUp');
  }

  get jumpPressed() {
    return this.isPressed('Space') || this.isPressed('KeyZ') || this.isPressed('KeyW') || this.isPressed('ArrowUp');
  }

  get dash() {
    return this.isDown('ShiftLeft') || this.isDown('ShiftRight') || this.isDown('KeyX');
  }

  get pausePressed() {
    return this.isPressed('Escape') || this.isPressed('KeyP');
  }
}

// グローバルにアクセスできるように公開
window.Input = new InputHandler();
