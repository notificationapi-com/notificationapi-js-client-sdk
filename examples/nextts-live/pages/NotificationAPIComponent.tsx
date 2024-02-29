import NotificationAPI from 'notificationapi-js-client-sdk';
import 'notificationapi-js-client-sdk/dist/styles.css';
import { PopupPosition } from 'notificationapi-js-client-sdk/lib/interfaces';
import { memo, useEffect } from 'react';

const NotificationAPIComponent = memo((props: { userId: string }) => {
  useEffect(() => {
    const notificationapi = new NotificationAPI({
      clientId: '54jas9ae4omlbbq3s0u0d9spui',
      userId: props.userId
    });
    notificationapi.showInApp({
      root: 'CONTAINER_DIV_ID',
      popupPosition: PopupPosition.BottomLeft
    });
  }, [props.userId]);

  return <div id="CONTAINER_DIV_ID"></div>;
});

export default NotificationAPIComponent;
