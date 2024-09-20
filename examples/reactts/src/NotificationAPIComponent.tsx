import NotificationAPI from 'notificationapi-js-client-sdk';
import { PopupPosition } from 'notificationapi-js-client-sdk/lib/interfaces';
import React, { memo, useEffect, useRef } from 'react';

const NotificationAPIComponent = memo((props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const notificationapi = new NotificationAPI({
      clientId: '54jas9ae4omlbbq3s0u0d9spui',
      userId: 'user1',
      customServiceWorkerPath:
        '/notificationapi-js-client-sdk/reactts/notificationapi-service-worker.js'
    });
    notificationapi.askForWebPushPermission();
    notificationapi.showInApp({
      root: 'container',
      popupPosition: PopupPosition.BottomRight
    });

    // Store a reference to the container DOM element.
    const container = containerRef.current;
    // This effect can run multiple times due to the `userId` changing
    // or Hot Module Replacement (HMR). Ensure the container is cleared
    // as `showInApp` will append to the container instead of overwriting it.
    return () => {
      if (container) container.innerHTML = '';
    };
  });

  return <div id="container" ref={containerRef}></div>;
});

export default NotificationAPIComponent;
