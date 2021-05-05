import $ from 'jquery';
import {
  InappNotification,
  WS_ClearUnreadRequest,
  WS_NotificationsRequest,
  WS_NotificationsResponse,
  WS_UnreadCountRequest,
  WS_UnreadCountResponse
} from '../interfaces';
import WS from 'jest-websocket-mock';
import notificationapi from '../index';

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
beforeEach(() => {
  spy = jest.spyOn(console, 'error').mockImplementation();
});

afterEach(() => {
  document.body.innerHTML = '<div id="root"></div>';
  WS.clean();
  spy.mockRestore();
  window.notificationapi.destroy();
});

describe('notificationapi', () => {
  test('should exist', () => {
    expect(notificationapi).toBeDefined();
  });

  describe('init', () => {
    test('given bad root element shows error', () => {
      notificationapi.init({
        root: 'none',
        clientId,
        userId
      });
      expect(spy.mock.calls).toEqual([
        ['There are no HTML elements with id="none" on the page.']
      ]);
    });

    test('given bad popupPosition, throws error', () => {
      notificationapi.init({
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

    test('adds the notificationapi container to the root', () => {
      notificationapi.init({
        root: 'root',
        clientId,
        userId
      });
      expect($('[id="root"]').children()[0].id).toEqual(
        'notificationapi-container'
      );
    });

    test('adds the notification popup button to the container', () => {
      notificationapi.init({
        root: 'root',
        clientId,
        userId
      });
      expect($('[id="notificationapi-container"]').children()[0].id).toEqual(
        'notificationapi-button'
      );
    });

    describe('inline options', () => {
      test('adds the notification popup to the container with .inline', () => {
        notificationapi.init({
          root: 'root',
          inline: true,
          clientId,
          userId
        });
        expect($('#notificationapi-popup').parent().attr('id')).toEqual(
          'notificationapi-container'
        );
        expect($('#notificationapi-popup').attr('class')).toEqual('inline');
      });

      test('openPopup and closePopup do not change popup style or throw error', () => {
        notificationapi.init({
          root: 'root',
          inline: true,
          clientId,
          userId
        });
        const classes = $('#notificationapi-popup')[0].classList;
        notificationapi.openPopup();
        expect($('#notificationapi-popup')[0].classList).toEqual(classes);
        notificationapi.closePopup();
        expect($('#notificationapi-popup')[0].classList).toEqual(classes);
        expect(spy.mock.calls).toEqual([]);
      });
    });

    describe('popup option', () => {
      test('without inline, adds the notification popup to the container with .hovering.closed', () => {
        notificationapi.init({
          root: 'root',
          clientId,
          userId
        });
        expect($('#notificationapi-popup').parent().attr('id')).toEqual(
          'notificationapi-container'
        );
        expect($('#notificationapi-popup').hasClass('popup'));
        expect($('#notificationapi-popup').hasClass('hovering'));
        expect($('#notificationapi-popup').hasClass('closed'));
      });
    });

    describe('websocket sends', () => {
      // TODO: test that the library will use the production websocket if not given a custom websocket
      test('given custom websocket, after init requests for unread and notifications', async () => {
        const server = new WS('ws://localhost:1234', { jsonProtocol: true });
        notificationapi.init({
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

    describe('recreation', () => {
      test('does not create two inline popups', () => {
        notificationapi.init({
          root: 'root',
          clientId,
          userId
        });

        notificationapi.init({
          root: 'root',
          clientId,
          userId
        });

        expect($('[id="notificationapi-button"]').length).toEqual(1);
        expect($('[id="notificationapi-popup"]').length).toEqual(1);
      });

      test('replaces button', () => {
        notificationapi.init({
          root: 'root',
          clientId,
          userId
        });

        $('#notificationapi-button').addClass('to-be-found');

        notificationapi.init({
          root: 'root',
          clientId,
          userId
        });

        expect($('.to-be-found').length).toEqual(0);
      });

      test('replaces existing inline popup', () => {
        notificationapi.init({
          root: 'root',
          inline: true,
          clientId,
          userId
        });
        notificationapi.processNotifications([testNotificationWithoutURL]);

        notificationapi.init({
          root: 'root',
          inline: true,
          clientId,
          userId
        });
        notificationapi.processNotifications([testNotification]);

        expect($('.notificationapi-notification')).toHaveLength(1);
        expect($('.notificationapi-notification').attr('href')).toEqual(
          testNotification.redirectURL
        );
      });
    });

    describe('mock', () => {
      test('given mock option, websocket is not used', async () => {
        const server = new WS('ws://localhost:1234', { jsonProtocol: true });

        notificationapi.init({
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
        notificationapi.init({
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
  });

  describe('websocket receives', () => {
    test('given malformed message, doesnt break', async () => {
      const server = new WS('ws://localhost:1234', { jsonProtocol: true });
      notificationapi.init({
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
      notificationapi.init({
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
      expect($('#notificationapi-unread').html()).toEqual('3');
    });

    test('given notifications, renders them', async () => {
      const server = new WS('ws://localhost:1234', { jsonProtocol: true });
      notificationapi.init({
        root: 'root',
        websocket: 'ws://localhost:1234',
        clientId,
        userId
      });
      await server.connected;
      const message: WS_NotificationsResponse = {
        route: 'inapp_web/notifications',
        payload: { notifications: [testNotification, testNotification] }
      };
      server.send(message);
      expect($('.notificationapi-notification')).toHaveLength(2);
    });

    test('given no notifications, renders empty state', async () => {
      const server = new WS('ws://localhost:1234', { jsonProtocol: true });
      notificationapi.init({
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
  });

  describe('popup interactions', () => {
    test('when button is clicked, popup has .hovering not .closed', () => {
      notificationapi.init({
        root: 'root',
        clientId,
        userId
      });
      $('#notificationapi-button').trigger('click');
      expect($('#notificationapi-popup').hasClass('hovering'));
      expect(!$('#notificationapi-popup').hasClass('closed'));
    });

    test('when button is clicked, removes unread badge and requests clearing unread', async () => {
      const server = new WS('ws://localhost:1234', { jsonProtocol: true });
      notificationapi.init({
        root: 'root',
        websocket: 'ws://localhost:1234',
        clientId,
        userId
      });
      await server.connected;
      await server.nextMessage;
      await server.nextMessage;
      $('#notificationapi-button').trigger('click');
      const expectedMsg: WS_ClearUnreadRequest = {
        route: 'inapp_web/unread_clear'
      };
      expect($('#notificationapi-unread').hasClass('hidden')).toBeTruthy();
      await expect(server).toReceiveMessage(expectedMsg);
    });

    test('when button is clicked then clicked again, popup has .closed', () => {
      notificationapi.init({
        root: 'root',
        clientId,
        userId
      });
      $('#notificationapi-button').trigger('click');
      $('#notificationapi-button').trigger('click');
      expect($('#notificationapi-popup').hasClass('closed'));
    });

    test('when button is clicked then popup content is clicked, popup is not .closed', () => {
      notificationapi.init({
        root: 'root',
        clientId,
        userId
      });
      $('#notificationapi-button').trigger('click');
      $('#notificationapi-header').trigger('click');
      expect(!$('#notificationapi-popup').hasClass('closed'));
    });

    test('when button is clicked then page clicked, popup has .closed', () => {
      notificationapi.init({
        root: 'root',
        clientId,
        userId
      });
      $('#notificationapi-button').trigger('click');
      $('body').trigger('click');
      expect($('#notificationapi-popup').hasClass('closed'));
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
        notificationapi.init({
          root: 'root',
          popupPosition,
          clientId,
          userId
        });
        $('#notificationapi-button').trigger('click');
      });
    });

    test('after scrolling to the end, requests notifications before the oldest notification, scrolling again immediately wouldnt trigger this behavior again', async () => {
      const server = new WS('ws://localhost:1234', { jsonProtocol: true });
      notificationapi.init({
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
            { ...testNotification, date: '1989-09-28T10:00:00.000Z' },
            testNotification
          ]
        }
      };
      server.send(res);
      $('#notificationapi-button').trigger('click');
      await server.nextMessage; // clear request
      $('#notificationapi-popup-inner')[0].dispatchEvent(
        new CustomEvent('scroll')
      );
      $('#notificationapi-popup-inner')[0].dispatchEvent(
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
      notificationapi.init({
        root: 'root',
        inline: true,
        clientId,
        userId
      });
      notificationapi.setUnread(123);
      expect($('#notificationapi-unread')).toHaveLength(0);
      expect(spy.mock.calls).toHaveLength(0);
    });

    test('given 0, is not displayed', () => {
      notificationapi.init({
        root: 'root',
        clientId,
        userId
      });
      notificationapi.setUnread(0);
      expect($('#notificationapi-unread').hasClass('hidden')).toBeTruthy();
    });

    test('given 1, shows 1', () => {
      notificationapi.init({
        root: 'root',
        clientId,
        userId
      });
      notificationapi.setUnread(1);
      expect($('#notificationapi-unread').hasClass('hidden')).toBeFalsy();
      expect($('#notificationapi-unread').html()).toEqual('1');
    });

    test('given 100, shows +99', () => {
      notificationapi.init({
        root: 'root',
        clientId,
        userId
      });
      notificationapi.setUnread(100);
      expect($('#notificationapi-unread').hasClass('hidden')).toBeFalsy();
      expect($('#notificationapi-unread').html()).toEqual('+99');
    });
  });

  describe('processNotifications', () => {
    test('without popupinner, does not throw', () => {
      notificationapi.init({
        root: 'root',
        clientId,
        userId
      });
      $('#notificationapi-popup-inner').remove();
      notificationapi.processNotifications([testNotification]);
      expect(spy.mock.calls).toEqual([]);
    });

    test('defaults to empty state (no notifications)', () => {
      notificationapi.init({
        root: 'root',
        clientId,
        userId
      });
      expect($('#notificationapi-empty')).toHaveLength(1);
      expect($('.notificationapi-notification')).toHaveLength(0);
    });

    test('given 0 notifications, adds no notifications and shows empty', () => {
      notificationapi.init({
        root: 'root',
        clientId,
        userId
      });
      notificationapi.processNotifications([]);
      expect($('#notificationapi-empty')).toHaveLength(1);
      expect($('.notificationapi-notification')).toHaveLength(0);
    });

    test('given any, removes empty state div', () => {
      notificationapi.init({
        root: 'root',
        clientId,
        userId
      });
      notificationapi.processNotifications([testNotification]);
      expect($('#notificationapi-empty')).toHaveLength(0);
    });

    test('given 2, adds 2 notifications', () => {
      notificationapi.init({
        root: 'root',
        clientId,
        userId
      });
      notificationapi.processNotifications([
        testNotification,
        testNotification
      ]);
      expect($('.notificationapi-notification')).toHaveLength(2);
    });

    test('given 1 notification, shows title, message, image and date with correct redirect', () => {
      notificationapi.init({
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
      notificationapi.init({
        root: 'root',
        clientId,
        userId
      });
      notificationapi.processNotifications([testNotificationWithoutURL]);
      expect($('.notificationapi-notification').attr('href')).toBeFalsy();
    });

    test('without image, ignores image, uses icon', () => {
      notificationapi.init({
        root: 'root',
        clientId,
        userId
      });
      notificationapi.processNotifications([testNotificationWithoutImage]);
      expect($('.notificationapi-notification-image')).toHaveLength(0);
    });

    test('unseen notification has unseen class on it', () => {
      notificationapi.init({
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
      notificationapi.init({
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
