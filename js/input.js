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

    // ボタン要素にタッチイベントを一括登録
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
    });
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
