/**
 * PWA インストール & アプリ内ブラウザ誘導コントローラー
 */
class PWAController {
  constructor() {
    this.deferredPrompt = null;
    this.modal = null;
    
    // サービスワーカーの登録
    this.registerServiceWorker();
    
    // DOMが読み込まれたらUIの初期化と判定を行う
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  // サービスワーカーの登録
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
          .then((reg) => console.log('[PWA] Service Worker registered successfully with scope:', reg.scope))
          .catch((err) => console.error('[PWA] Service Worker registration failed:', err));
      });
    }
  }

  // 判定ロジックとUI表示のセットアップ
  init() {
    this.modal = document.getElementById('pwa-modal');
    if (!this.modal) return;

    // イベントリスナーのセットアップ
    this.setupEvents();

    // 状態をチェックして表示切り替え
    this.checkAndDisplayUI();
  }

  setupEvents() {
    // Android/Chrome等のPWAインストールボタン有効化イベント
    window.addEventListener('beforeinstallprompt', (e) => {
      // デフォルトのブラウザプロンプト表示を抑制
      e.preventDefault();
      // イベントを保持
      this.deferredPrompt = e;
      console.log('[PWA] beforeinstallprompt event captured');

      // 状態をチェックしてUIをアップデート
      this.checkAndDisplayUI();
      
      // ゲームがすでに起動しており、タイトル画面にいる場合はモーダルを表示する
      if (window.GameInstance && window.GameInstance.state === 'TITLE') {
        this.showModal();
      }
    });

    // アプリがインストールされたときのイベント
    window.addEventListener('appinstalled', (evt) => {
      console.log('[PWA] App installed successfully');
      this.deferredPrompt = null;
      this.hideModal();
    });

    // モーダル内の閉じるボタンイベント
    const closeBtn = document.getElementById('pwa-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hideModal();
        // 今セッション（タブを開いている間）は再表示しないようにする
        sessionStorage.setItem('pwa-modal-dismissed', 'true');
      });
    }

    // インストール実行ボタンイベント
    const installBtn = document.getElementById('pwa-btn-install');
    if (installBtn) {
      installBtn.addEventListener('click', () => {
        if (this.deferredPrompt) {
          // プロンプトを表示
          this.deferredPrompt.prompt();
          // ユーザーの選択結果を取得
          this.deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('[PWA] User accepted the install prompt');
            } else {
              console.log('[PWA] User dismissed the install prompt');
            }
            this.deferredPrompt = null;
            this.hideModal();
          });
        }
      });
    }
  }

  // PWAスタンドアロン（インストール済み）起動の判定
  isStandalone() {
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = ('standalone' in window.navigator) && window.navigator.standalone;
    return isStandaloneMode || isIOSStandalone;
  }

  // アプリ内ブラウザ（非PWAブラウザ）の判定
  isInAppBrowser() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    // LINE, X(Twitter), Instagram, Facebook, Messenger等のWebView検知
    const rules = [
      /Line/i,
      /Twitter/i,
      /FBAN/i,
      /FBIOS/i,
      /Instagram/i,
      /MicroMessenger/i, // WeChat
      /Kakaotalk/i,
      /Webview/i, // 一般的なWebView
    ];
    return rules.some(rx => rx.test(ua));
  }

  // OSの取得 (iOS/Android)
  getOS() {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) {
      return 'android';
    }
    // iPadOS 13+ の判定も含める
    if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      return 'ios';
    }
    return 'other';
  }

  // UIの表示可否の判断と出し分け
  checkAndDisplayUI() {
    // 1. スタンドアロン起動（インストール済み）なら何も表示しない
    if (this.isStandalone()) {
      this.hideModal();
      return;
    }

    // 2. セッション中にすでに閉じている場合は表示しない
    if (sessionStorage.getItem('pwa-modal-dismissed') === 'true') {
      this.hideModal();
      return;
    }

    const os = this.getOS();
    const inApp = this.isInAppBrowser();

    const installArea = document.getElementById('pwa-install-area');
    const guideArea = document.getElementById('pwa-guide-area');
    const inAppArea = document.getElementById('pwa-inapp-area');

    // すべて一度非表示にする
    if (installArea) installArea.classList.add('pwa-hidden');
    if (guideArea) guideArea.classList.add('pwa-hidden');
    if (inAppArea) inAppArea.classList.add('pwa-hidden');

    if (inApp) {
      // 【ケースA: アプリ内ブラウザから開かれている】
      if (inAppArea) {
        inAppArea.classList.remove('pwa-hidden');
        const targetBrowser = document.getElementById('pwa-target-browser');
        const inappInstructions = document.getElementById('pwa-inapp-instructions');
        
        if (os === 'ios') {
          if (targetBrowser) targetBrowser.textContent = 'Safari';
          if (inappInstructions) {
            inappInstructions.innerHTML = '右上のボタン（または共有ボタン）を押して、<br><strong>「Safari で開く」</strong>を選択してください。';
          }
        } else {
          if (targetBrowser) targetBrowser.textContent = 'Chrome';
          if (inappInstructions) {
            inappInstructions.innerHTML = '右上のメニュー（縦の３点リーダーなど）から、<br><strong>「Chrome で開く」</strong>または<strong>「ブラウザで開く」</strong>を選択してください。';
          }
        }
      }
    } else {
      // 【ケースB: 標準ブラウザから開かれている】
      if (this.deferredPrompt) {
        // PWAインストールがサポートされており、プロンプトが実行可能な場合 (Android/Chrome, PC Chrome等)
        if (installArea) installArea.classList.remove('pwa-hidden');
      } else if (os === 'ios') {
        // iOS Safari の場合 (beforeinstallpromptは発生しないがホーム画面追加は可能)
        if (guideArea) {
          guideArea.classList.remove('pwa-hidden');
        }
      } else {
        // その他、PWAに未対応のPCブラウザなどではモーダルを出さない
        this.hideModal();
        return;
      }
    }
  }

  // モーダルを表示する (game.js等からタイトル画面表示時に呼び出す)
  showModal() {
    if (this.isStandalone() || sessionStorage.getItem('pwa-modal-dismissed') === 'true') {
      return;
    }
    
    // 最新の状態に更新してから表示
    this.checkAndDisplayUI();
    
    if (this.modal) {
      // 表示すべきコンテンツがある場合のみモーダルを可視化する
      const installArea = document.getElementById('pwa-install-area');
      const guideArea = document.getElementById('pwa-guide-area');
      const inAppArea = document.getElementById('pwa-inapp-area');
      
      const hasContent = (installArea && !installArea.classList.contains('pwa-hidden')) ||
                          (guideArea && !guideArea.classList.contains('pwa-hidden')) ||
                          (inAppArea && !inAppArea.classList.contains('pwa-hidden'));
                          
      if (hasContent) {
        this.modal.classList.remove('pwa-hidden');
        this.modal.classList.add('pwa-show');
      }
    }
  }

  // モーダルを非表示にする
  hideModal() {
    if (this.modal) {
      this.modal.classList.remove('pwa-show');
      this.modal.classList.add('pwa-hidden');
    }
  }
}

// グローバルインスタンスの作成
window.PWAController = new PWAController();
