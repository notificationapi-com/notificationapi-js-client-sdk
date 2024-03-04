'use client';

import 'notificationapi-js-client-sdk/dist/styles.css';
import { memo, useEffect } from 'react';
const NotificationAPIComponent = memo((props: { userId: string }) => {
  useEffect(() => {
    const loadNotificationAPI = async () => {
      const NotificationAPI = (await import('notificationapi-js-client-sdk'))
        .default;
      const notificationapi = new NotificationAPI({
        clientId: '54jas9ae4omlbbq3s0u0d9spui',
        userId: props.userId
      });
      notificationapi.showInApp({
        root: 'CONTAINER_DIV_ID'
      });
    };

    // Call the async function
    loadNotificationAPI();
  }, [props.userId]);

  return <div id="CONTAINER_DIV_ID"></div>;
});

NotificationAPIComponent.displayName = 'NotificationAPIComponent';

export default NotificationAPIComponent;
