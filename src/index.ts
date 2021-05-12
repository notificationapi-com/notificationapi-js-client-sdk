import {
  InappNotification,
  Options,
  WS_ClearUnreadRequest,
  WS_NewNotificationsResponse,
  WS_NotificationsRequest,
  WS_NotificationsResponse,
  WS_UnreadCountRequest,
  WS_UnreadCountResponse
} from './interfaces';

import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo('en-US');

require('./assets/styles.css');

const defaultWebSocket =
  'wss://fp7umb7q2c.execute-api.us-east-1.amazonaws.com/dev';

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
  private state: {
    notifications: InappNotification[];
    unread: number;
    lastNotificationsRequestAt: number;
    options: Options | null;
    oldestNotificationsDate: string;
  } = {
    lastNotificationsRequestAt: 0,
    notifications: [],
    options: null,
    unread: 0,
    oldestNotificationsDate: ''
  };

  private elements: {
    unread: HTMLDivElement | null;
    popup: HTMLDivElement;
    popupInner: HTMLDivElement;
    button: HTMLButtonElement | null;
    websocket: WebSocket | null;
    root: HTMLElement | null;
    empty: HTMLDivElement | null;
  } = {
    unread: null,
    popup: document.createElement('div'),
    popupInner: document.createElement('div'),
    button: null,
    websocket: null,
    root: null,
    empty: null
  };

  destroy(): void {
    this.state = {
      lastNotificationsRequestAt: 0,
      notifications: [],
      options: null,
      unread: 0,
      oldestNotificationsDate: ''
    };
    this.elements.button?.remove();
    this.elements.button = null;
    this.elements.popup.remove();
    this.elements.popupInner.remove();
    this.elements.unread?.remove();
    this.elements.unread = null;
    this.elements.websocket?.close();
    this.elements.websocket = null;
    this.elements.empty?.remove();
    this.elements.empty = null;
  }

  constructor(options: Options) {
    this.state.options = options;

    // validation
    const root = document.getElementById(options.root);
    if (!root) {
      console.error(
        `There are no HTML elements with id="${options.root}" on the page.`
      );
      return;
    }
    this.elements.root = root;

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

    // clean existing
    if (root.hasChildNodes()) {
      root.innerHTML = '';
    }

    // render top level container
    const container = document.createElement('div');
    container.classList.add('notificationapi-container');
    root.appendChild(container);

    // render popup & button & unread badge
    const popup = this.elements.popup;
    popup.classList.add('notificationapi-popup');
    if (options.inline) {
      popup.classList.add('inline');
    } else {
      popup.classList.add('popup');
      popup.classList.add('hovering');
      popup.classList.add('closed');

      // button
      const button = document.createElement('button');
      button.classList.add('notificationapi-button');
      button.innerHTML = `<span class="icon-bell-o"></span>`;
      container.appendChild(button);
      button.onclick = () => {
        if (popup.classList.contains('closed')) {
          this.openPopup();
        } else {
          this.closePopup();
        }
      };
      this.elements.button = button;

      window.addEventListener('click', (e) => {
        const clickedPopup =
          (e.target as Element).closest('.notificationapi-popup') ?? false;
        const clickedButton =
          (e.target as Element).closest('.notificationapi-button') ?? false;
        if (!clickedButton && !clickedPopup) {
          popup.classList.add('closed');
        }
      });

      // unread badge
      const unread = document.createElement('div');
      unread.classList.add('notificationapi-unread');
      button.appendChild(unread);
      this.elements.unread = unread;
      this.setUnread(this.state.unread);
    }
    container.appendChild(popup);

    // render popup inner container
    const popupInner = this.elements.popupInner;
    popupInner.classList.add('notificationapi-popup-inner');
    popup.appendChild(popupInner);
    this.elements.popupInner = popupInner;

    // render header
    const header = document.createElement('h1');
    header.innerHTML = 'Notifications';
    header.classList.add('notificationapi-header');
    popupInner.appendChild(header);

    // render default empty state
    const empty = document.createElement('div');
    empty.classList.add('notificationapi-empty');
    empty.innerHTML = "You don't have any notifications!";
    popupInner.appendChild(empty);
    this.elements.empty = empty;

    this.processNotifications(this.state.notifications);

    popupInner.onscroll = () => {
      if (
        popupInner.scrollTop + popupInner.clientHeight >=
          popupInner.scrollHeight - 100 && // 100px before the end
        new Date().getTime() - this.state.lastNotificationsRequestAt >= 500 &&
        this.elements.websocket
      ) {
        this.state.lastNotificationsRequestAt = new Date().getTime();
        const moreNotificationsRequest: WS_NotificationsRequest = {
          route: 'inapp_web/notifications',
          payload: {
            before: this.state.oldestNotificationsDate,
            count: 50
          }
        };
        this.elements.websocket.send(JSON.stringify(moreNotificationsRequest));
      }
    };

    // connect to WS
    if (!options.mock) {
      const websocketAddress = `${
        options.websocket ?? defaultWebSocket
      }?envId=${options.clientId}&userId=${options.userId}`;
      const ws: WebSocket = new WebSocket(websocketAddress);
      ws.onopen = () => {
        const unreadReq: WS_UnreadCountRequest = {
          route: 'inapp_web/unread_count'
        };
        ws.send(JSON.stringify(unreadReq));

        const notificationsReq: WS_NotificationsRequest = {
          route: 'inapp_web/notifications',
          payload: {
            count: 50
          }
        };
        ws.send(JSON.stringify(notificationsReq));
      };
      ws.onmessage = (m: MessageEvent) => {
        const body = JSON.parse(m.data);

        if (!body || !body.route) {
          return;
        }

        if (body.route === 'inapp_web/unread_count') {
          const message = body as WS_UnreadCountResponse;
          this.setUnread(message.payload.count);
        }

        if (body.route === 'inapp_web/notifications') {
          const message = body as WS_NotificationsResponse;
          this.processNotifications(message.payload.notifications);
        }

        if (body.route === 'inapp_web/new_notifications') {
          const message = body as WS_NewNotificationsResponse;
          const beforeCount = this.state.notifications.length;
          this.processNotifications(message.payload.notifications);
          const afterCount = this.state.notifications.length;
          this.setUnread(this.state.unread + afterCount - beforeCount);
        }
      };
      this.elements.websocket = ws;
    }
  }

  openPopup(): void {
    if (
      this.elements.popup &&
      this.elements.button &&
      this.state.options &&
      !this.state.options.inline
    ) {
      position(
        this.elements.popup,
        this.elements.button,
        this.state.options.popupPosition ?? 'rightBottom'
      );
      this.setUnread(0);
      this.elements.popup.classList.remove('closed');
    }

    if (this.elements.websocket && this.elements.websocket.readyState === 1) {
      const clearReq: WS_ClearUnreadRequest = {
        route: 'inapp_web/unread_clear'
      };
      this.elements.websocket.send(JSON.stringify(clearReq));
    }
  }

  closePopup(): void {
    if (
      this.elements.popup &&
      this.state.options &&
      !this.state.options.inline
    ) {
      this.elements.popup.classList.add('closed');
    }
  }

  setUnread(count: number): void {
    this.state.unread = count;
    if (
      this.elements.unread &&
      this.state.options &&
      !this.state.options.inline
    ) {
      if (count === 0) {
        this.elements.unread.classList.add('hidden');
      } else {
        this.elements.unread.classList.remove('hidden');
      }

      if (count < 100) {
        this.elements.unread.innerHTML = count + '';
      } else {
        this.elements.unread.innerHTML = '+99';
      }
    }
  }

  processNotifications(notifications: InappNotification[]): void {
    // filter existing
    const newNotifications = notifications.filter((n) => {
      const found = this.state.notifications.find((existingN) => {
        return existingN.id === n.id;
      });
      return found ? false : true;
    });

    this.state.notifications = this.state.notifications.concat(
      newNotifications
    );

    this.state.notifications.map((n) => {
      if (
        this.elements.popupInner.querySelector(
          `#notificationapi-notification-${n.id}`
        )
      ) {
        return;
      }
      if (
        !this.state.oldestNotificationsDate ||
        n.date < this.state.oldestNotificationsDate
      ) {
        this.state.oldestNotificationsDate = n.date;
      }
      const notification = document.createElement('a');
      notification.id = `notificationapi-notification-${n.id}`;
      notification.classList.add('notificationapi-notification');

      if (!n.seen) {
        notification.classList.add('unseen');
      }

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
      date.innerHTML = timeAgo.format(new Date(n.date), 'round-minute');
      notificationMetaContainer.appendChild(date);

      notification.appendChild(notificationMetaContainer);
      // processNotifications always happens after init(), ensuring popupInner is there
      /* istanbul ignore next */
      this.elements.popupInner?.appendChild(notification);
    });
    if (newNotifications.length > 0 && this.elements.empty) {
      this.elements.empty.remove();
      this.elements.empty = null;
    }
  }
}

export default NotificationAPI;
