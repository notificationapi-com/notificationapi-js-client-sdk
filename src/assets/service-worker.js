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
  const url = data.url;

  event.waitUntil(
    self.registration.showNotification(title, {
      body: message,
      tag,
      icon,
      data: {
        url: url
      }
    })
  );
});

// Handle the notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // close the notification
  var url = event.notification.data.url; // get the URL from the notification data
  if (url) {
    event.waitUntil(
      clients.openWindow(url) // open the URL in a new window
    );
  }
});
