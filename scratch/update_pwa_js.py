import re

with open("e:/AI_Playground/mario/js/pwa.js", "r", encoding="utf-8") as f:
    content = f.read()

# 1. イベントリスナーの追加
event_listener_code = """
    // 標準ブラウザで開くボタンイベント
    const openBrowserBtn = document.getElementById('pwa-btn-open-browser');
    if (openBrowserBtn) {
      openBrowserBtn.addEventListener('click', () => {
        const url = location.href;
        const os = this.getOS();
        
        if (os === 'android') {
          // Androidの場合はChromeのIntentスキームを利用する
          const urlWithoutScheme = url.replace(/^https?:\\/\\//, '');
          const intentUrl = `intent://${urlWithoutScheme}#Intent;scheme=https;package=com.android.chrome;end`;
          location.href = intentUrl;
        } else {
          // iOS等: クリップボードにコピーしてアラート表示
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => {
              alert('URLをコピーしました！\\nSafariを開いて貼り付けてください。');
            }).catch(() => {
              window.open(url, '_blank', 'noopener,noreferrer');
            });
          } else {
            // fallback
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        }
      });
    }
  }

  // PWAスタンドアロン（インストール済み）起動の判定
"""
content = re.sub(r'  }\n\n  // PWAスタンドアロン（インストール済み）起動の判定', event_listener_code, content)

# 2. checkAndDisplayUI の In-App ロジック簡略化
old_inapp_logic = """    if (inApp) {
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
    } else {"""

new_inapp_logic = """    if (inApp) {
      // 【ケースA: アプリ内ブラウザから開かれている】
      if (inAppArea) {
        inAppArea.classList.remove('pwa-hidden');
      }
    } else {"""

content = content.replace(old_inapp_logic, new_inapp_logic)

with open("e:/AI_Playground/mario/js/pwa.js", "w", encoding="utf-8") as f:
    f.write(content)

print("pwa.js updated.")
