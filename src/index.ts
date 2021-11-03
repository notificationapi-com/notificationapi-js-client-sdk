import {
  InappNotification,
  InAppOptions,
  InitOptions,
  NotificationAPIClientInterface,
  PopupPosition,
  Preference,
  UserPreferencesOptions,
  WS_ANY_VALID_REQUEST,
  WS_ClearUnreadRequest,
  WS_NewNotificationsResponse,
  WS_NotificationsRequest,
  WS_NotificationsResponse,
  WS_UnreadCountResponse,
  WS_UserPreferencesResponse
} from './interfaces';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';

try {
  TimeAgo.addDefaultLocale(en);
  // eslint-disable-next-line no-empty
} catch (e) {
  /* 
    TimeAgo.addDefaultLocale throws error on being
    invoked more than once. It may be invoked more
    than when requiring this file multiple times.
  */
}
const timeAgo = new TimeAgo('en-US');

require('./assets/styles.css');

const defaultWebSocket =
  'wss://fp7umb7q2c.execute-api.us-east-1.amazonaws.com/dev';

const notificationReqCount = 50;

function position(
  popup: HTMLDivElement,
  popupInner: HTMLDivElement,
  button: HTMLButtonElement,
  popupPosition: PopupPosition
) {
  const position: string = popupPosition.toString();

  let maxHeight = document.documentElement.clientHeight + 'px';
  let top = 'auto';
  let bottom = 'auto';
  let left = 'auto';
  let right = 'auto';

  if (window.innerWidth < 768) {
    top = -button.getBoundingClientRect().top + 'px';
    bottom =
      -(
        document.documentElement.clientHeight -
        button.getBoundingClientRect().bottom
      ) + 'px';
    left = -button.getBoundingClientRect().left + 'px';
    right =
      -(
        document.documentElement.clientWidth -
        button.getBoundingClientRect().right
      ) + 'px';
  } else {
    if (position.startsWith('top')) {
      bottom = button.clientHeight + 10 + 'px';
      maxHeight = button.getBoundingClientRect().top - 20 + 'px';
    }

    if (position.startsWith('bottom')) {
      bottom = 'auto';
      top = button.clientHeight + 10 + 'px';
      maxHeight =
        window.innerHeight - button.getBoundingClientRect().bottom - 40 + 'px';
    }

    if (position.startsWith('left')) {
      left = 'auto';
      right = button.clientWidth + 10 + 'px';
    }

    if (position.startsWith('right')) {
      right = 'auto';
      left = button.clientWidth + 10 + 'px';
    }

    if (position.endsWith('Top')) {
      top = 'auto';
      bottom = '0px';
      maxHeight = button.getBoundingClientRect().bottom - 20 + 'px';
    }

    if (position.endsWith('Bottom')) {
      bottom = 'auto';
      top = '0px';
      maxHeight =
        window.innerHeight - button.getBoundingClientRect().top - 40 + 'px';
    }

    if (position.endsWith('Left')) {
      left = 'auto';
      right = '0px';
    }

    if (position.endsWith('Right')) {
      right = 'auto';
      left = '0px';
    }
  }

  popup.style.top = top;
  popup.style.bottom = bottom;
  popup.style.left = left;
  popup.style.right = right;
  popupInner.style.maxHeight = maxHeight;
}

class NotificationAPIClient implements NotificationAPIClientInterface {
  state: NotificationAPIClientInterface['state'];
  elements: NotificationAPIClientInterface['elements'];
  websocket?: WebSocket;

  destroy = (): void => {
    this.websocket?.close();
    Object.values(this.elements).map((e) => {
      e && e.remove();
    });
  };

  constructor(options: InitOptions) {
    this.elements = {};
    this.state = {
      initOptions: options,
      lastNotificationsRequestAt: 0,
      notifications: [],
      unread: 0,
      oldestNotificationsDate: ''
    };

    // connect to WS
    if (options.websocket !== false) {
      const websocketAddress = `${
        options.websocket ?? defaultWebSocket
      }?envId=${encodeURIComponent(
        options.clientId
      )}&userId=${encodeURIComponent(options.userId)}${
        options.userIdHash
          ? '&userIdHash=' + encodeURIComponent(options.userIdHash)
          : ''
      }`;
      this.websocket = new WebSocket(websocketAddress);
    }
  }

  showInApp = (options: InAppOptions) => {
    this.state.inappOptions = options;

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
      !Object.values(PopupPosition).includes(options.popupPosition)
    ) {
      console.error(
        `"${
          options.popupPosition
        }" is not a valid position. Valid positions: ${Object.values(
          PopupPosition
        ).join(', ')}`
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
    this.elements.popup = document.createElement('div');
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
          this.openInAppPopup();
        } else {
          this.closeInAppPopup();
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
      this.setInAppUnread(this.state.unread);
    }
    container.appendChild(popup);

    // render popup inner container
    this.elements.popupInner = document.createElement('div');
    const popupInner = this.elements.popupInner;
    popupInner.classList.add('notificationapi-popup-inner');
    popup.appendChild(popupInner);
    this.elements.popupInner = popupInner;

    // render header
    const headerCloseButton = document.createElement('button');
    const headerHeading = document.createElement('h1');
    headerHeading.innerHTML = 'Notifications';
    headerCloseButton.innerHTML =
      '<i class=".notificationapi-arrow .notificationapi-arrow-left"></i>';
    this.elements.header = document.createElement('div');
    this.elements.header.appendChild(headerCloseButton);
    this.elements.header.appendChild(headerHeading);
    headerCloseButton.addEventListener('click', () => {
      this.closeInAppPopup();
    });
    this.elements.header.classList.add('notificationapi-header');
    popupInner.appendChild(this.elements.header);

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
        this.websocket &&
        (this.state.lastResponseNotificationsCount === undefined ||
          this.state.lastResponseNotificationsCount >= notificationReqCount)
      ) {
        this.state.lastNotificationsRequestAt = new Date().getTime();
        const moreNotificationsRequest: WS_NotificationsRequest = {
          route: 'inapp_web/notifications',
          payload: {
            before: this.state.oldestNotificationsDate,
            count: notificationReqCount
          }
        };
        this.websocket.send(JSON.stringify(moreNotificationsRequest));
      }
    };

    // use WS for inapp
    this.sendWSMessage({
      route: 'inapp_web/unread_count'
    });
    this.sendWSMessage({
      route: 'inapp_web/notifications',
      payload: {
        count: notificationReqCount
      }
    });

    if (this.websocket) {
      const ws = this.websocket;
      ws.addEventListener('message', (m: MessageEvent) => {
        const body = JSON.parse(m.data);

        if (!body || !body.route) {
          return;
        }

        if (body.route === 'inapp_web/unread_count') {
          const message = body as WS_UnreadCountResponse;
          this.setInAppUnread(message.payload.count);
        }

        if (body.route === 'inapp_web/notifications') {
          const message = body as WS_NotificationsResponse;
          this.state.lastResponseNotificationsCount =
            message.payload.notifications.length;
          this.processNotifications(message.payload.notifications);
          if (
            message.payload.notifications.length < notificationReqCount &&
            !this.elements.empty
          ) {
            const noMore = document.createElement('div');
            noMore.innerHTML = 'No more notifications to load';
            noMore.classList.add('notificationapi-nomore');
            popupInner.append(noMore);
          }
        }

        if (body.route === 'inapp_web/new_notifications') {
          const message = body as WS_NewNotificationsResponse;
          const beforeCount = this.state.notifications.length;
          this.processNotifications(message.payload.notifications);
          const afterCount = this.state.notifications.length;
          this.setInAppUnread(this.state.unread + afterCount - beforeCount);
        }
      });
    }
  };

  showUserPreferences = (options?: UserPreferencesOptions) => {
    this.state.userPreferencesOptions = options;

    if (!this.elements.preferencesContainer) {
      // create container
      const root = document.getElementsByTagName('body')[0];
      const container = document.createElement('div');
      container.classList.add('notificationapi-preferences-container');
      this.elements.preferencesContainer = container;
      root.appendChild(container);

      // create backdrop
      const backdrop = document.createElement('div');
      backdrop.classList.add('notificationapi-preferences-backdrop');
      backdrop.addEventListener('click', () => {
        container.classList.add('closed');
      });
      container.appendChild(backdrop);

      // create popup
      const popup = document.createElement('div');
      popup.classList.add('notificationapi-preferences-popup');
      container.appendChild(popup);
      this.elements.preferencesPopup = popup;

      // create close button
      const close = document.createElement('button');
      close.classList.add('notificationapi-preferences-close');
      close.addEventListener('click', () => {
        container.classList.add('closed');
      });
      popup.appendChild(close);

      // create title
      const title = document.createElement('h1');
      title.innerHTML = 'Notification Preferences';
      popup.appendChild(title);

      // render loading state
      const loading = document.createElement('div');
      loading.classList.add('notificationapi-loading');
      const icon = document.createElement('span');
      icon.classList.add('icon-spinner', 'spinner');
      loading.appendChild(icon);
      popup.appendChild(loading);
      this.elements.preferencesLoading = loading;

      if (this.websocket) {
        const ws = this.websocket;
        ws.addEventListener('message', (m) => {
          const body = JSON.parse(m.data);

          if (!body || !body.route) {
            return;
          }

          if (body.route === 'user_preferences/preferences') {
            const message = body as WS_UserPreferencesResponse;
            this.renderPreferences(message.payload.userPreferences);
          }
        });
      }
    } else {
      this.elements.preferencesContainer.classList.remove('closed');
    }

    // Request user preferences every time render is run to get the latest
    this.sendWSMessage({
      route: 'user_preferences/get_preferences'
    });
  };

  openInAppPopup(): void {
    if (
      this.elements.popup &&
      this.elements.popupInner &&
      this.elements.button &&
      this.state.inappOptions &&
      !this.state.inappOptions.inline
    ) {
      position(
        this.elements.popup,
        this.elements.popupInner,
        this.elements.button,
        this.state.inappOptions.popupPosition ?? PopupPosition.RightBottom
      );
      this.setInAppUnread(0);
      this.elements.popup.classList.remove('closed');
    }
    if (this.websocket && this.websocket.readyState === 1) {
      const clearReq: WS_ClearUnreadRequest = {
        route: 'inapp_web/unread_clear'
      };
      this.websocket.send(JSON.stringify(clearReq));
    }
  }

  closeInAppPopup(): void {
    if (
      this.elements.popup &&
      this.state.inappOptions &&
      !this.state.inappOptions.inline
    ) {
      this.elements.popup.classList.add('closed');
    }
  }

  setInAppUnread(count: number): void {
    this.state.unread = count;
    if (
      this.elements.unread &&
      this.state.inappOptions &&
      !this.state.inappOptions.inline
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
    const header = this.elements.header;
    const popupInner = this.elements.popupInner;
    if (!header || !popupInner) return;

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

    this.state.notifications.sort((a, b) => {
      return Date.parse(b.date) - Date.parse(a.date);
    });

    this.state.notifications.map((n, i) => {
      if (popupInner.querySelector(`[data-notification-id="${n.id}"]`)) {
        return;
      }
      if (
        !this.state.oldestNotificationsDate ||
        n.date < this.state.oldestNotificationsDate
      ) {
        this.state.oldestNotificationsDate = n.date;
      }
      const notification = document.createElement('a');
      notification.setAttribute('data-notification-id', n.id);
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
      if (date.innerHTML === 'in a moment') {
        date.innerHTML = 'just now';
      }

      notificationMetaContainer.appendChild(date);

      notification.appendChild(notificationMetaContainer);

      if (i === 0) {
        header.insertAdjacentElement('afterend', notification);
      } else {
        const preNotificationEl = popupInner.querySelector(
          `[data-notification-id="${this.state.notifications[i - 1].id}"]`
        );
        // ignoring the else statement coverage: unknown scenario.
        /* istanbul ignore next */
        if (preNotificationEl) {
          preNotificationEl.insertAdjacentElement('afterend', notification);
        } else {
          console.error(
            'error finding previous notification',
            this.state.notifications[i - 1]
          );
        }
      }
    });
    if (newNotifications.length > 0 && this.elements.empty) {
      this.elements.empty.remove();
      delete this.elements.empty;
    }
  }

  renderPreferences(preferences: Preference[]): void {
    if (!this.elements.preferencesPopup) return;

    // remove loading
    this.elements.preferencesLoading?.remove();
    this.elements.preferencesLoading = undefined;

    const popup = this.elements.preferencesPopup;
    const validPreferences = preferences.filter((p) => p.settings.length > 0);
    if (validPreferences.length === 0 && !this.elements.preferencesEmpty) {
      const empty = document.createElement('div');
      empty.classList.add('notificationapi-preferences-empty');
      empty.innerHTML = 'There are no notifications to configure.';
      popup.appendChild(empty);
      this.elements.preferencesEmpty = empty;
      return;
    }

    // render grid
    this.elements.preferencesGrid?.remove();
    this.elements.preferencesGrid = undefined;
    const grid = document.createElement('div');
    grid.classList.add('notificationapi-preferences-grid');
    this.elements.preferencesGrid = grid;
    popup.appendChild(grid);

    const channels: Record<string, string> = {};
    validPreferences.map((p) => {
      p.settings.map((s) => {
        if (!channels[s.channel]) channels[s.channel] = s.channelName;
      });
    });

    Object.values(channels).map((v, i) => {
      const channel = document.createElement('div');
      channel.innerHTML = v;
      channel.classList.add(
        'notificationapi-preferences-channel',
        `notificationapi-preferences-col${i + 2}`
      );
      grid.appendChild(channel);
    });

    // render preference rows
    validPreferences.map((pref) => {
      const title = document.createElement('div');
      title.classList.add(
        'notificationapi-preferences-title',
        'notificationapi-preferences-col1'
      );
      title.innerHTML = pref.title;
      grid.appendChild(title);
      pref.settings.map((s) => {
        const toggle = document.createElement('div');
        const col = Object.keys(channels).indexOf(s.channel) + 2;
        toggle.classList.add(
          'notificationapi-preferences-toggle',
          `notificationapi-preferences-col${col}`
        );
        toggle.setAttribute('data-notificationId', pref.notificationId);
        toggle.setAttribute('data-channel', s.channel);

        const label = document.createElement('label');
        label.classList.add('switch');
        toggle.appendChild(label);

        const input = document.createElement('input');
        input.setAttribute('type', 'checkbox');
        input.checked = s.state;
        label.appendChild(input);
        const i = document.createElement('i');
        label.appendChild(i);

        input.addEventListener('change', () => {
          this.sendWSMessage({
            route: 'user_preferences/patch_preferences',
            payload: {
              notificationId: pref.notificationId,
              data: [
                {
                  channel: s.channel,
                  state: input.checked
                }
              ]
            }
          });
        });
        grid.appendChild(toggle);
      });

      if (pref.subNotificationPreferences) {
        const expand = document.createElement('button');
        expand.innerHTML = 'expand';
        expand.setAttribute('data-notificationId', pref.notificationId);
        const col = Object.keys(channels).length + 2;
        expand.classList.add(
          'notificationapi-preferences-expand',
          `notificationapi-preferences-col${col}`
        );
        expand.addEventListener('click', (e) => {
          const expand = e.target as HTMLButtonElement;
          const notificationId = expand.getAttribute('data-notificationId');
          popup
            .querySelectorAll(
              `[data-notificationId="${notificationId}"][data-subNotificationId]`
            )
            .forEach((e) => {
              e.classList.toggle('closed');
            });
        });
        grid.appendChild(expand);

        pref.subNotificationPreferences.map((subPref) => {
          const title = document.createElement('div');
          title.classList.add(
            'notificationapi-preferences-subtitle',
            'notificationapi-preferences-col1',
            'closed'
          );
          title.setAttribute(
            'data-subNotificationId',
            subPref.subNotificationId
          );

          title.setAttribute('data-notificationId', pref.notificationId);
          title.innerHTML = subPref.title;
          grid.appendChild(title);
          subPref.settings.map((s) => {
            const toggle = document.createElement('div');
            const col = Object.keys(channels).indexOf(s.channel) + 2;
            toggle.classList.add(
              'notificationapi-preferences-subtoggle',
              `notificationapi-preferences-col${col}`,
              'closed'
            );
            toggle.setAttribute('data-notificationId', subPref.notificationId);
            toggle.setAttribute(
              'data-subNotificationId',
              subPref.subNotificationId
            );
            toggle.setAttribute('data-channel', s.channel);

            const label = document.createElement('label');
            label.classList.add('switch', 'small');
            toggle.appendChild(label);

            const input = document.createElement('input');
            input.setAttribute('type', 'checkbox');
            input.checked = s.state;
            label.appendChild(input);
            const i = document.createElement('i');
            label.appendChild(i);

            input.addEventListener('change', () => {
              this.sendWSMessage({
                route: 'user_preferences/patch_preferences',
                payload: {
                  notificationId: pref.notificationId,
                  subNotificationId: subPref.subNotificationId,
                  data: [
                    {
                      channel: s.channel,
                      state: input.checked
                    }
                  ]
                }
              });
            });
            grid.appendChild(toggle);
          });
        });
      }
    });
  }

  sendWSMessage(request: WS_ANY_VALID_REQUEST): void {
    if (!this.websocket) return;
    const ws = this.websocket;
    if (ws.readyState == ws.OPEN) {
      ws.send(JSON.stringify(request));
    } else {
      ws.addEventListener('open', () => {
        ws.send(JSON.stringify(request));
      });
    }
  }
}

const NotificationAPI = {
  init: (options: InitOptions): NotificationAPIClient => {
    return new NotificationAPIClient(options);
  }
};

export default NotificationAPI;
