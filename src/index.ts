import {
  InappNotification,
  Options,
  WS_NotificationsRequest,
  WS_NotificationsResponse,
  WS_UnreadCountRequest,
  WS_UnreadCountResponse
} from './interfaces';

require('./assets/styles.css');

const defaultWebSocket = 'ws://default';

declare global {
  interface Window {
    notificationapi: NotificationAPI;
  }
}

const validPopupPositions = [
  'topLeft',
  'topRight',
  'leftTop',
  'leftBottom',
  'bottomLeft',
  'bottomRight',
  'rightTop',
  'rightBottom'
];

function position(
  popup: HTMLDivElement,
  button: HTMLButtonElement,
  position: string
) {
  if (position.startsWith('top')) {
    popup.style.top = 'auto';
    popup.style.bottom = button.clientHeight + 10 + 'px';
  }

  if (position.startsWith('bottom')) {
    popup.style.bottom = 'auto';
    popup.style.top = button.clientHeight + 10 + 'px';
  }

  if (position.startsWith('left')) {
    popup.style.left = 'auto';
    popup.style.right = button.clientWidth + 10 + 'px';
  }

  if (position.startsWith('right')) {
    popup.style.right = 'auto';
    popup.style.left = button.clientWidth + 10 + 'px';
  }

  if (position.endsWith('Top')) {
    popup.style.top = 'auto';
    popup.style.bottom = '0px';
  }

  if (position.endsWith('Bottom')) {
    popup.style.bottom = 'auto';
    popup.style.top = '0px';
  }

  if (position.endsWith('Left')) {
    popup.style.left = 'auto';
    popup.style.right = '0px';
  }

  if (position.endsWith('Right')) {
    popup.style.right = 'auto';
    popup.style.left = '0px';
  }
}

class NotificationAPI {
  private notifications: InappNotification[] = [];
  private unread?: HTMLDivElement;
  private popupInner: HTMLDivElement = document.createElement('div');

  init(options: Options) {
    // validation
    const root = document.getElementById(options.root);
    if (!root) {
      console.error(
        `There are no HTML elements with id="${options.root}" on the page.`
      );
      return;
    }

    if (
      options.popupPosition &&
      !validPopupPositions.includes(options.popupPosition)
    ) {
      console.error(
        `"${
          options.popupPosition
        }" is not a valid position. Valid positions: ${validPopupPositions.join(
          ', '
        )}`
      );
      return;
    }

    // empty existing
    if (root.hasChildNodes()) {
      root.innerHTML = '';
    }

    // render top level container
    const container = document.createElement('div');
    container.id = 'notificationapi-container';
    container.style.position = 'relative';
    root.appendChild(container);

    // render popup & button & unread badge
    const popup = document.createElement('div');
    popup.id = 'notificationapi-popup';
    if (options.inline) {
      popup.classList.add('inline');
      this.unread = undefined;
    } else {
      popup.classList.add('popup');
      popup.classList.add('hovering');
      popup.classList.add('closed');

      // button
      const button = document.createElement('button');
      button.id = 'notificationapi-button';
      button.innerHTML = `<span class="icon-bell-o"></span>`;
      container.appendChild(button);
      button.onclick = () => {
        if (popup.classList.contains('closed')) {
          position(popup, button, options.popupPosition ?? 'rightBottom');
          popup.classList.remove('closed');
        } else popup.classList.add('closed');
      };
      window.addEventListener('click', (e) => {
        const clickedPopup =
          (e.target as Element).closest('#notificationapi-popup') ?? false;
        const clickedButton =
          (e.target as Element).closest('#notificationapi-button') ?? false;
        if (!clickedButton && !clickedPopup) {
          popup.classList.add('closed');
        }
      });

      // unread badge
      this.unread = document.createElement('div');
      this.unread.id = 'notificationapi-unread';
      this.unread.innerHTML = '';
      this.unread.classList.add('hidden');
      button.appendChild(this.unread);
    }
    container.appendChild(popup);

    // render popup inner container
    this.popupInner = document.createElement('div');
    this.popupInner.id = 'notificationapi-popup-inner';
    popup.appendChild(this.popupInner);

    // render header
    const header = document.createElement('h1');
    header.innerHTML = 'Notifications';
    header.id = 'notificationapi-header';
    this.popupInner.appendChild(header);

    // render default state
    const zeroNotifications = document.createElement('div');
    zeroNotifications.id = 'notificationapi-zero-notifications';
    zeroNotifications.innerHTML =
      "<div>You don't have any notifications!</div>";
    this.popupInner.appendChild(zeroNotifications);

    // load fake notifications
    if (options.notifications) {
      this.processNotifications(options.notifications);
    }

    // connect to WS
    let client: WebSocket;
    if (!options.notifications) {
      client = new WebSocket(options.websocket ?? defaultWebSocket);
      client.onopen = () => {
        const unreadReq: WS_UnreadCountRequest = {
          type: 'inapp_web/unread_count',
          payload: {
            envId: 'envId',
            userId: 'userId'
          }
        };
        client.send(JSON.stringify(unreadReq));

        const notificationsReq: WS_NotificationsRequest = {
          type: 'inapp_web/notifications',
          payload: {
            count: 50,
            envId: 'envId',
            userId: 'userId'
          }
        };
        client.send(JSON.stringify(notificationsReq));
      };
      client.onmessage = (m: MessageEvent) => {
        const body = JSON.parse(m.data);

        if (!body || !body.type) {
          return;
        }

        if (body.type === 'inapp_web/unread') {
          const message = body as WS_UnreadCountResponse;
          this.setUnread(message.payload.count);
        }

        if (body.type === 'inapp_web/notifications') {
          const message = body as WS_NotificationsResponse;
          this.processNotifications(message.payload.notifications);
        }
      };
    }

    this.popupInner.onscroll = () => {
      if (
        window.scrollY >=
        this.popupInner.offsetTop +
          this.popupInner.clientHeight -
          window.innerHeight
      ) {
        const moreNotificationsRequest: WS_NotificationsRequest = {
          type: 'inapp_web/notifications',
          payload: {
            before: 'test',
            count: 50,
            envId: 'envId',
            userId: 'userId'
          }
        };
        client?.send(JSON.stringify(moreNotificationsRequest));
        console.log('requesting more');
      }
    };
  }

  setUnread(count: number) {
    if (this.unread) {
      if (count === 0) {
        this.unread.classList.add('hidden');
      } else {
        this.unread.classList.remove('hidden');
      }

      if (count < 100) {
        this.unread.innerHTML = count + '';
      } else {
        this.unread.innerHTML = '+99';
      }
    }
  }

  processNotifications(notifications: InappNotification[]) {
    this.notifications.concat(notifications);
    notifications.map((n) => {
      const notification = document.createElement('a');
      notification.classList.add('notificationapi-notification');

      if (n.redirectURL) {
        notification.href = n.redirectURL;
      }

      const notificationImageContainer = document.createElement('div');
      notificationImageContainer.classList.add(
        'notificationapi-notification-imageContainer'
      );
      if (n.imageURL) {
        const notificationImage = document.createElement('img');
        notificationImage.classList.add('notificationapi-notification-image');
        notificationImage.src = n.imageURL;
        notificationImageContainer.appendChild(notificationImage);
      } else {
        const notificationIcon = document.createElement('span');
        notificationIcon.classList.add('icon-commenting-o');
        notificationIcon.classList.add(
          'notificationapi-notification-defaultIcon'
        );
        notificationImageContainer.appendChild(notificationIcon);
      }
      notification.appendChild(notificationImageContainer);

      const notificationMetaContainer = document.createElement('div');
      notificationMetaContainer.classList.add(
        'notificationapi-notification-metaContainer'
      );

      const notificationTitle = document.createElement('p');
      notificationTitle.classList.add('notificationapi-notification-title');
      notificationTitle.innerHTML = n.title;
      notificationMetaContainer.appendChild(notificationTitle);

      const date = document.createElement('p');
      date.classList.add('notificationapi-notification-date');
      date.innerHTML = 'now';
      notificationMetaContainer.appendChild(date);

      notification.appendChild(notificationMetaContainer);
      this.popupInner.appendChild(notification);
    });
  }
}

window.notificationapi = new NotificationAPI();
export default window.notificationapi;
