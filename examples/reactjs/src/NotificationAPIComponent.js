import NotificationAPI from 'notificationapi-js-client-sdk';
import { PopupPosition } from 'notificationapi-js-client-sdk/lib/interfaces';
import React, { memo, useEffect, useRef } from 'react';

const NotificationAPIComponent = memo((props) => {
  const containerRef = useRef();

  useEffect(() => {
    const notificationapi = new NotificationAPI({
      clientId: '24nojpnrsdc53fkslha0roov05',
      userId: 'sahand'
    });
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
      container.innerHTML = '';
    };
  }, [props.userId]);

  return <div id="container" ref={containerRef}></div>;
});

export default NotificationAPIComponent;