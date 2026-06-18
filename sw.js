// ── 루틴 트래커 서비스워커 ───────────────────────────────
// 업데이트 전략:
//  - HTML(내비게이션 요청): network-first → 오프라인일 때만 캐시 폴백.
//    앱을 자주 업데이트해도 온라인이면 항상 최신 HTML을 받음(캐시에 갇히지 않음).
//  - 그 외 정적 GET(gstatic Firebase SDK, 폰트 등): stale-while-revalidate로 가속.
//  - config.js / gstatic SDK는 precache하지 않고 런타임 캐시.

const CACHE_NAME = 'routine-cache-v1';

// 핵심 셸만 최소 precache (404로 install 실패하지 않게).
const CORE_ASSETS = [
  './index.html',
  './icon.png',
  './manifest.json'
];

// ── install: 핵심 셸 precache + 즉시 활성화 ──────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      // 개별 add로 감싸 하나가 404여도 install이 실패하지 않게 함
      Promise.all(CORE_ASSETS.map(url =>
        cache.add(url).catch(() => {})
      ))
    ).then(() => self.skipWaiting())
  );
});

// ── activate: 옛 버전 캐시 정리 + 즉시 제어권 확보 ──────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── fetch ───────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;

  // GET 외(POST 등)는 패스 — Firebase 쓰기/인증은 그대로 네트워크로
  if (req.method !== 'GET') return;

  // config.js(Firebase 설정) → network-first: 키 회전·DB 이전 시 즉시 반영.
  // SWR로 캐시하면 변경 후 한 박자 늦게 반영되므로 제외한다.
  if (new URL(req.url).pathname.endsWith('/config.js')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req).then(cached => cached || Response.error()))
    );
    return;
  }

  // 내비게이션(HTML) 요청 → network-first, 실패 시 캐시 폴백
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          // 성공 응답을 ./index.html과 실제 req 키 양쪽에 저장 →
          // 오프라인 폴백이 어느 키로든 매칭되게 한다.
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put('./index.html', copy.clone());
            cache.put(req, copy);
          }).catch(() => {});
          return res;
        })
        .catch(() =>
          // 폴백 체인: index.html → 실제 req → ./ → 항상 유효한 503 응답
          caches.match('./index.html')
            .then(c => c || caches.match(req))
            .then(c => c || caches.match('./'))
            .then(c => c || new Response(
              '오프라인 상태입니다. 네트워크 연결 후 다시 시도하세요.',
              { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            ))
        )
    );
    return;
  }

  // 그 외 GET → stale-while-revalidate (gstatic SDK/폰트 등 가속)
  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        // 정상 응답만 캐시 (opaque 응답도 폰트/SDK 가속 위해 저장)
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
