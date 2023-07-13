// subscribeWebPushUser.ts
import { PushSubscription } from './interfaces';
import { Client } from './utils/client';

const defaultRestAPIUrl = 'https://api.notificationapi.com';
export const subscribeWebPushUser = (
  applicationServerKey: string,
  clientId: string,
  userId: string,
  hashUserId?: string
): void => {
  const client = new Client({
    authorization: 'Basic ' + btoa(`${clientId}:${userId}:${hashUserId}`),
    url: `${defaultRestAPIUrl}/${clientId}/users/${userId}`
  });
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/notificationapi-sw.js')
      .then(async (registration) => {
        Notification.requestPermission().then(async (permission) => {
          if (permission === 'granted') {
            await registration.pushManager
              .subscribe({
                userVisibleOnly: true,
                applicationServerKey
              })
              .then(async (res) => {
                await client.post({
                  webPushTokens: [
                    {
                      sub: {
                        endpoint: res.toJSON().endpoint as string,
                        keys: res.toJSON().keys as PushSubscription['keys']
                      }
                    }
                  ]
                });
              });
          }
        });
      });
  }
};
