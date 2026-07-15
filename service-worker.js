const CACHE_NAME = 'hotel-cleaner-v4';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './js/input.js',
  './js/audio.js',
  './js/player.js',
  './js/enemy.js',
  './js/tilemap.js',
  './js/game.js',
  './js/pwa.js',
  './manifest.json'
];

// インストール時に静的アセットをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching offline assets');
        // 個別にキャッシュすることで、一部のファイルが失敗しても他のキャッシュが通るようにする
        return Promise.all(
          ASSETS.map((url) => {
            return cache.add(url).catch((err) => {
              console.warn(`[Service Worker] Failed to cache: ${url}`, err);
            });
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

// アクティベート時に古いキャッシュをクリーンアップ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log(`[Service Worker] Clearing old cache: ${cache}`);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// リクエストのフェッチ処理 (キャッシュ優先、なければネットワーク)
self.addEventListener('fetch', (event) => {
  // HTTP/HTTPSリクエストのみを対象にする (Chrome拡張機能などのリクエストを弾く)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // POSTなどの非GETリクエストはキャッシュしない
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          // レスポンスが無効な場合はキャッシュせずそのまま返す
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 取得したリクエストを動的にキャッシュに格納
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch((err) => {
          console.error('[Service Worker] Fetch failed; returning offline fallback if available.', err);
        });
    })
  );
});
