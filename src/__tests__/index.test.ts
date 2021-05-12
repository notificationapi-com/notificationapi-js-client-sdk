import $ from 'jquery';
import {
  InappNotification,
  WS_ClearUnreadRequest,
  WS_NewNotificationsResponse,
  WS_NotificationsRequest,
  WS_NotificationsResponse,
  WS_UnreadCountRequest,
  WS_UnreadCountResponse
} from '../interfaces';
import WS from 'jest-websocket-mock';
import NotificationAPI from '../index';

const testNotification: InappNotification = {
  id: '1',
  seen: true,
  title: 'You have a new comment',
  redirectURL: 'https://www.notificationapi.com',
  imageURL: 'https://via.placeholder.com/350x150',
  date: new Date().toISOString()
};

const testNotificationWithoutImage: InappNotification = {
  id: '2',
  seen: true,
  title: 'You have a new comment',
  redirectURL: 'https://www.notificationapi.com',
  date: new Date().toISOString()
};

const testNotificationWithoutURL: InappNotification = {
  id: '3',
  seen: true,
  title: 'You have a new comment',
  imageURL: 'https://via.placeholder.com/350x150',
  date: new Date().toISOString()
};

const testNotificationUnseen: InappNotification = {
  id: '4',
  seen: false,
  title: 'You have a new comment',
  date: new Date().toISOString()
};

const clientId = 'envId';
const userId = 'userId';

let spy: jest.SpyInstance;
let notificationapi: NotificationAPI;
let notificationapi2: NotificationAPI;
beforeEach(() => {
  spy = jest.spyOn(console, 'error').mockImplementation();
});

afterEach(() => {
  document.body.innerHTML = '<div id="root"></div><div id="root2"></div>';
  WS.clean();
  spy.mockRestore();
  if (notificationapi) notificationapi.destroy();
  if (notificationapi2) notificationapi2.destroy();
});

describe('notificationapi', () => {
  describe('init', () => {
    test('given bad root element shows error', () => {
      notificationapi = new NotificationAPI({
        root: 'none',
        clientId,
        userId
      });
      expect(spy.mock.calls).toEqual([
        ['There are no HTML elements with id="none" on the page.']
      ]);
    });

    test('given bad popupPosition, throws error', () => {
      notificationapi = new NotificationAPI({
        root: 'root',
        popupPosition: 'blah',
        clientId,
        userId
      });
      expect(spy.mock.calls).toEqual([
        [
          '"blah" is not a valid position. Valid positions: topLeft, topRight, leftTop, leftBottom, bottomLeft, bottomRight, rightTop, rightBottom'
        ]
      ]);
    });

    test('adds the a notificationapi container to the root', () => {
      notificationapi = new NotificationAPI({
        root: 'root',
        clientId,
        userId
      });
      expect($('[id="root"] > .notificationapi-container')).toHaveLength(1);
    });

    test('adds the notification popup button to the container', () => {
      notificationapi = new NotificationAPI({
        root: 'root',
        clientId,
        userId
      });
      expect(
        $('.notificationapi-container > .notificationapi-button')
      ).toHaveLength(1);
    });

    describe('inline options', () => {
      test('adds a notification popup to the container with .inline', () => {
        notificationapi = new NotificationAPI({
          root: 'root',
          inline: true,
          clientId,
          userId
        });
        expect(
          $(
            '.notificationapi-container > .notificationapi-popup.inline:not(.popup)'
          )
        ).toHaveLength(1);
      });

      test('openPopup and closePopup do not change popup style or throw error', () => {
        notificationapi = new NotificationAPI({
          root: 'root',
          inline: true,
          clientId,
          userId
        });
        const classes = $('.notificationapi-popup')[0].classList;
        notificationapi.openPopup();
        expect($('.notificationapi-popup')[0].classList).toEqual(classes);
        notificationapi.closePopup();
        expect($('.notificationapi-popup')[0].classList).toEqual(classes);
        expect(spy.mock.calls).toEqual([]);
      });
    });

    describe('popup option', () => {
      test('without inline, adds the notification popup to the container with .hovering.closed', () => {
        notificationapi = new NotificationAPI({
          root: 'root',
          clientId,
          userId
        });
        expect(
          $(
            '.notificationapi-container > .notificationapi-popup.popup.hovering.closed:not(.inline)'
          )
        ).toHaveLength(1);
      });
    });

    describe('websocket sends', () => {
      // TODO: test that the library will use the production websocket if not given a custom websocket
      test('given custom websocket, after init requests for unread and notifications', async () => {
        const server = new WS('ws://localhost:1234', { jsonProtocol: true });
        notificationapi = new NotificationAPI({
          root: 'root',
          websocket: 'ws://localhost:1234',
          clientId,
          userId
        });
        await server.connected;
        const req1: WS_UnreadCountRequest = {
          route: 'inapp_web/unread_count'
        };
        const req2: WS_NotificationsRequest = {
          route: 'inapp_web/notifications',
          payload: {
            count: 50
          }
        };
        await expect(server).toReceiveMessage(req1);
        await expect(server).toReceiveMessage(req2);
      });
    });

    describe('mock', () => {
      test('given mock option, websocket is not used', async () => {
        const server = new WS('ws://localhost:1234', { jsonProtocol: true });

        notificationapi = new NotificationAPI({
          root: 'root',
          clientId,
          userId,
          mock: true,
          websocket: 'ws://localhost:1234'
        });
        let connected = false;
        server.on('connection', () => {
          connected = true;
        });
        await new Promise((resolve) => setTimeout(resolve, 1000)); // wait 1s

        expect(connected).toBeFalsy();
      });

      test('can show notifications inline', async () => {
        notificationapi = new NotificationAPI({
          root: 'root',
          clientId,
          userId,
          mock: true,
          inline: true,
          websocket: 'ws://localhost:1234'
        });
        notificationapi.processNotifications([testNotification]);
        expect($('.notificationapi-notification')).toHaveLength(1);
      });
    });

    describe('multiple initializations', () => {
      test('maintains 2 separate websocket connections', async () => {
        const server1 = new WS('ws://localhost:1234', { jsonProtocol: true });
        const server2 = new WS('ws://localhost:1235', { jsonProtocol: true });
        let connections1 = 0;
        let connections2 = 0;
        server1.on('connection', () => {
          connections1++;
        });
        server2.on('connection', () => {
          connections2++;
        });
        notificationapi = new NotificationAPI({
          root: 'root',
          clientId,
          userId,
          websocket: 'ws://localhost:1234'
        });

        notificationapi2 = new NotificationAPI({
          root: 'root2',
          clientId,
          userId,
          websocket: 'ws://localhost:1235'
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));
        expect(connections1).toEqual(1);
        expect(connections2).toEqual(1);
      });

      test('maintains separate unread count', async () => {
        notificationapi = new NotificationAPI({
          root: 'root',
          clientId,
          userId
        });
        notificationapi.setUnread(3);

        notificationapi2 = new NotificationAPI({
          root: 'root2',
          clientId,
          userId
        });
        notificationapi2.setUnread(0);

        expect($('.notificationapi-unread')[0].innerHTML).toEqual('3');
        expect($('.notificationapi-unread')[0].classList).not.toContain(
          'hidden'
        );
        expect($('.notificationapi-unread')[1].innerHTML).toEqual('0');
        expect($('.notificationapi-unread')[1].classList).toContain('hidden');
      });

      test('maintains separate notifications', async () => {
        notificationapi = new NotificationAPI({
          root: 'root',
          clientId,
          userId
        });

        notificationapi.processNotifications([
          testNotification,
          testNotificationUnseen
        ]);

        notificationapi2 = new NotificationAPI({
          root: 'root2',
          clientId,
          userId
        });

        notificationapi2.processNotifications([testNotification]);

        expect(
          $('.notificationapi-popup-inner:nth(0) .notificationapi-notification')
        ).toHaveLength(2);
        expect(
          $('.notificationapi-popup-inner:nth(1) .notificationapi-notification')
        ).toHaveLength(1);
      });
    });
  });

  describe('websocket receives', () => {
    test('given malformed message, doesnt break', async () => {
      const server = new WS('ws://localhost:1234', { jsonProtocol: true });
      notificationapi = new NotificationAPI({
        root: 'root',
        websocket: 'ws://localhost:1234',
        clientId,
        userId
      });
      await server.connected;
      server.send('test');
      expect(spy.mock.calls).toHaveLength(0);
    });

    test('given unread count, renders it', async () => {
      const server = new WS('ws://localhost:1234', { jsonProtocol: true });
      notificationapi = new NotificationAPI({
        root: 'root',
        websocket: 'ws://localhost:1234',
        clientId,
        userId
      });
      await server.connected;
      const res: WS_UnreadCountResponse = {
        route: 'inapp_web/unread_count',
        payload: {
          count: 3
        }
      };
      server.send(res);
      expect($('.notificationapi-unread').html()).toEqual('3');
    });

    test('given notifications, renders them', async () => {
      const server = new WS('ws://localhost:1234', { jsonProtocol: true });
      notificationapi = new NotificationAPI({
        root: 'root',
        websocket: 'ws://localhost:1234',
        clientId,
        userId
      });
      await server.connected;
      const message: WS_NotificationsResponse = {
        route: 'inapp_web/notifications',
        payload: { notifications: [testNotification, testNotificationUnseen] }
      };
      server.send(message);
      expect($('.notificationapi-notification')).toHaveLength(2);
    });

    test('given no notifications, renders empty state', async () => {
      const server = new WS('ws://localhost:1234', { jsonProtocol: true });
      notificationapi = new NotificationAPI({
        root: 'root',
        websocket: 'ws://localhost:1234',
        clientId,
        userId
      });
      await server.connected;
      const message: WS_NotificationsResponse = {
        route: 'inapp_web/notifications',
        payload: { notifications: [] }
      };
      server.send(message);
      expect($('.notificationapi-notification')).toHaveLength(0);
      expect($('.notificationapi-notification')).toHaveLength(0);
    });

    test('given new notifications (actual new and repeats), updates actual unread count on popup and shows actual new notificaitons in popup', async () => {
      const server = new WS('ws://localhost:1234', { jsonProtocol: true });
      notificationapi = new NotificationAPI({
        root: 'root',
        websocket: 'ws://localhost:1234',
        clientId,
        userId
      });
      await server.connected;
      await server.nextMessage;
      await server.nextMessage;
      const message1: WS_NotificationsResponse = {
        route: 'inapp_web/notifications',
        payload: { notifications: [testNotification] }
      };
      server.send(message1);
      const message2: WS_UnreadCountResponse = {
        route: 'inapp_web/unread_count',
        payload: { count: 1 }
      };
      server.send(message2);
      const message3: WS_NewNotificationsResponse = {
        route: 'inapp_web/new_notifications',
        payload: {
          notifications: [
            testNotification,
            testNotificationUnseen,
            testNotificationWithoutImage
          ]
        }
      };
      server.send(message3);
      expect($('.notificationapi-notification')).toHaveLength(3);
      expect($('.notificationapi-unread').text()).toEqual('3');
    });
  });

  describe('popup interactions', () => {
    test('when button is clicked, popup has .hovering not .closed', async () => {
      notificationapi = new NotificationAPI({
        root: 'root',
        clientId,
        userId
      });
      $('.notificationapi-button').trigger('click');
      expect($('.notificationapi-popup').hasClass('hovering'));
      expect(!$('.notificationapi-popup').hasClass('closed'));
    });

    test('when button is clicked, removes unread badge and requests clearing unread', async () => {
      const server = new WS('ws://localhost:1234', { jsonProtocol: true });
      notificationapi = new NotificationAPI({
        root: 'root',
        websocket: 'ws://localhost:1234',
        clientId,
        userId
      });
      await server.connected;
      await server.nextMessage;
      await server.nextMessage;
      $('.notificationapi-button').trigger('click');
      const expectedMsg: WS_ClearUnreadRequest = {
        route: 'inapp_web/unread_clear'
      };
      expect($('.notificationapi-unread').hasClass('hidden')).toBeTruthy();
      await expect(server).toReceiveMessage(expectedMsg);
    });

    test('when button is clicked then clicked again, popup has .closed', async () => {
      notificationapi = new NotificationAPI({
        root: 'root',
        clientId,
        userId
      });
      $('.notificationapi-button').trigger('click');
      $('.notificationapi-button').trigger('click');
      expect($('.notificationapi-popup').hasClass('closed'));
    });

    test('when button is clicked then popup content is clicked, popup is not .closed', () => {
      notificationapi = new NotificationAPI({
        root: 'root',
        clientId,
        userId
      });
      $('.notificationapi-button').trigger('click');
      $('.notificationapi-header').trigger('click');
      expect(!$('.notificationapi-popup').hasClass('closed'));
    });

    test('when button is clicked then page clicked, popup has .closed', () => {
      notificationapi = new NotificationAPI({
        root: 'root',
        clientId,
        userId
      });
      $('.notificationapi-button').trigger('click');
      $('body').trigger('click');
      expect($('.notificationapi-popup').hasClass('closed'));
    });

    test('works with all different popupPosition variations', () => {
      [
        'topLeft',
        'topRight',
        'leftTop',
        'leftBottom',
        'bottomLeft',
        'bottomRight',
        'rightTop',
        'rightBottom'
      ].map((popupPosition) => {
        notificationapi = new NotificationAPI({
          root: 'root',
          popupPosition,
          clientId,
          userId
        });
        $('.notificationapi-button').trigger('click');
      });
    });

    test('after scrolling to the end, requests notifications before the oldest notification, scrolling again immediately wouldnt trigger this behavior again', async () => {
      const server = new WS('ws://localhost:1234', { jsonProtocol: true });
      notificationapi = new NotificationAPI({
        root: 'root',
        websocket: 'ws://localhost:1234',
        clientId,
        userId
      });
      await server.connected;
      await server.nextMessage; // unread request
      await server.nextMessage; // notifications request
      const res: WS_NotificationsResponse = {
        route: 'inapp_web/notifications',
        payload: {
          notifications: [
            testNotification,
            {
              ...testNotificationWithoutImage,
              date: '1989-09-28T10:00:00.000Z'
            },
            testNotificationWithoutURL
          ]
        }
      };
      server.send(res);
      $('.notificationapi-button').trigger('click');
      await server.nextMessage; // clear request
      $('.notificationapi-popup-inner')[0].dispatchEvent(
        new CustomEvent('scroll')
      );
      $('.notificationapi-popup-inner')[0].dispatchEvent(
        new CustomEvent('scroll')
      );

      const req4: WS_NotificationsRequest = {
        route: 'inapp_web/notifications',
        payload: {
          before: '1989-09-28T10:00:00.000Z',
          count: 50
        }
      };
      await expect(server).toReceiveMessage(req4);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // wait 1s
      expect(server.messages).toHaveLength(4);
    });
  });

  describe('setUnread', () => {
    test('doesnt not display or break in inline mode', () => {
      notificationapi = new NotificationAPI({
        root: 'root',
        inline: true,
        clientId,
        userId
      });
      notificationapi.setUnread(123);
      expect($('.notificationapi-unread')).toHaveLength(0);
      expect(spy.mock.calls).toHaveLength(0);
    });

    test('given 0, is not displayed', () => {
      notificationapi = new NotificationAPI({
        root: 'root',
        clientId,
        userId
      });
      notificationapi.setUnread(0);
      expect($('.notificationapi-unread').hasClass('hidden')).toBeTruthy();
    });

    test('given 1, shows 1', () => {
      notificationapi = new NotificationAPI({
        root: 'root',
        clientId,
        userId
      });
      notificationapi.setUnread(1);
      expect($('.notificationapi-unread').hasClass('hidden')).toBeFalsy();
      expect($('.notificationapi-unread').html()).toEqual('1');
    });

    test('given 100, shows +99', () => {
      notificationapi = new NotificationAPI({
        root: 'root',
        clientId,
        userId
      });
      notificationapi.setUnread(100);
      expect($('.notificationapi-unread').hasClass('hidden')).toBeFalsy();
      expect($('.notificationapi-unread').html()).toEqual('+99');
    });
  });

  describe('processNotifications', () => {
    test('without popupinner, does not throw', () => {
      notificationapi = new NotificationAPI({
        root: 'root',
        clientId,
        userId
      });
      $('.notificationapi-popup-inner').remove();
      notificationapi.processNotifications([testNotification]);
      expect(spy.mock.calls).toEqual([]);
    });

    test('defaults to empty state (no notifications)', () => {
      notificationapi = new NotificationAPI({
        root: 'root',
        clientId,
        userId
      });
      expect($('.notificationapi-empty')).toHaveLength(1);
      expect($('.notificationapi-notification')).toHaveLength(0);
    });

    test('given 0 notifications, adds no notifications and shows empty', () => {
      notificationapi = new NotificationAPI({
        root: 'root',
        clientId,
        userId
      });
      notificationapi.processNotifications([]);
      expect($('.notificationapi-empty')).toHaveLength(1);
      expect($('.notificationapi-notification')).toHaveLength(0);
    });

    test('given any, removes empty state div', () => {
      notificationapi = new NotificationAPI({
        root: 'root',
        clientId,
        userId
      });
      notificationapi.processNotifications([testNotification]);
      expect($('.notificationapi-empty')).toHaveLength(0);
    });

    test('given 2, adds 2 notifications', () => {
      notificationapi = new NotificationAPI({
        root: 'root',
        clientId,
        userId
      });
      notificationapi.processNotifications([
        testNotification,
        testNotificationUnseen
      ]);
      expect($('.notificationapi-notification')).toHaveLength(2);
    });

    test('given 1 notification, shows title, message, image and date with correct redirect', () => {
      notificationapi = new NotificationAPI({
        root: 'root',
        clientId,
        userId
      });
      notificationapi.processNotifications([testNotification]);
      expect($('.notificationapi-notification').attr('href')).toEqual(
        testNotification.redirectURL
      );
      expect($('.notificationapi-notification-title').text()).toEqual(
        testNotification.title
      );
      expect($('.notificationapi-notification-image').attr('src')).toEqual(
        testNotification.imageURL
      );
      expect($('.notificationapi-notification-date').text()).toEqual(
        'just now'
      );
    });

    test('without url, does not redirect', () => {
      notificationapi = new NotificationAPI({
        root: 'root',
        clientId,
        userId
      });
      notificationapi.processNotifications([testNotificationWithoutURL]);
      expect($('.notificationapi-notification').attr('href')).toBeFalsy();
    });

    test('without image, ignores image, uses icon', () => {
      notificationapi = new NotificationAPI({
        root: 'root',
        clientId,
        userId
      });
      notificationapi.processNotifications([testNotificationWithoutImage]);
      expect($('.notificationapi-notification-image')).toHaveLength(0);
    });

    test('unseen notification has unseen class on it', () => {
      notificationapi = new NotificationAPI({
        root: 'root',
        clientId,
        userId
      });
      notificationapi.processNotifications([testNotificationUnseen]);
      expect(
        $('.notificationapi-notification').hasClass('unseen')
      ).toBeTruthy();
    });

    test('notifications with repeat ID are not added', () => {
      notificationapi = new NotificationAPI({
        root: 'root',
        clientId,
        userId
      });
      notificationapi.processNotifications([testNotification]);
      notificationapi.processNotifications([testNotification]);
      expect($('.notificationapi-notification')).toHaveLength(1);
    });
  });
});
