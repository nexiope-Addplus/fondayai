// Fonday Service Worker — Push Notifications
const CACHE_VERSION = "fonday-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

// ── Push 이벤트: 서버에서 알림 수신 ──────────────────────────────
self.addEventListener("push", event => {
  let data = { title: "🌿 Fonday", body: "오늘의 피부 건강 팁", url: "/" };
  try {
    data = event.data ? event.data.json() : data;
  } catch {}

  const options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.url || "/" },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ── 알림 클릭: 앱으로 포커스 이동 ──────────────────────────────
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
