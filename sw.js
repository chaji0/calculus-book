/* 움직이는 미적분 — 서비스 워커
 *
 * ★ 교과서 내용을 수정해서 새로 올릴 때는 아래 VERSION 숫자를 반드시 하나 올려 주세요.
 *   (예: v1.0.0 → v1.0.1)  이 숫자가 바뀌어야 학생들의 앱이 새 버전을 받아옵니다.
 */
var VERSION = "v1.0.10";

var CACHE = "moving-calc-" + VERSION;
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k.indexOf("moving-calc-") === 0 && k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      /* 3D 탭용 three.js 는 설치를 막지 않도록 "되면 좋고" 방식으로 미리 받아 둔다 */
      caches.open(CACHE).then(function (c) { return c.add("./three.min.js"); }).catch(function () {});
      return self.clients.claim();
    })
  );
});

self.addEventListener("message", function (e) {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

/* 페이지(HTML)는 네트워크 우선(항상 최신 시도, 실패하면 캐시 = 오프라인 지원),
 * 나머지 파일은 캐시 우선. */
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put("./index.html", copy); });
        return res;
      }).catch(function () {
        return caches.match("./index.html");
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.ok && req.url.indexOf(self.location.origin) === 0) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
