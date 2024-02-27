import NotificationAPI from 'notificationapi-js-client-sdk';
import 'notificationapi-js-client-sdk/dist/styles.css';
import { PopupPosition } from 'notificationapi-js-client-sdk/lib/interfaces';
import { memo, useEffect } from 'react';

const NotificationAPIComponent = memo((props: { userId: string }) => {
  useEffect(() => {
    const notificationapi = new NotificationAPI({
      clientId: '9uisjmi87ud1vb2ms3gtg93sa',
      userId: 'mohammad+testNext@notificationapi.com',
      language: 'fr-FR'
    });
    notificationapi.showInApp({
      root: 'CONTAINER_DIV_ID',
      popupPosition: PopupPosition.BottomLeft
    });
  }, [props.userId]);

  return <div id="CONTAINER_DIV_ID"></div>;
});

export default NotificationAPIComponent;
