// service-worker.js
self.addEventListener('push', (event) => {
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return;
  }
  const data = event.data.json();
  const title = data.title;
  const message = data.message;
  const icon = data.icon;
  const tag = data.tag;

  // Log the URL of each client this service worker controls

  event.waitUntil(
    self.registration.showNotification(title, {
      body: message,
      tag,
      icon
    })
  );
});
