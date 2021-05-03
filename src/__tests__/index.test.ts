import notificationapi from '../index';
import * as $ from 'jquery';
import {
  InappNotification,
  WS_NotificationsRequest,
  WS_NotificationsResponse,
  WS_UnreadCountRequest
} from '../interfaces';
import WS from 'jest-websocket-mock';

const testNotification: InappNotification = {
  title: 'You have a new comment',
  redirectURL: 'https://www.notificationapi.com',
  imageURL: 'https://via.placeholder.com/350x150',
  date: new Date()
};

const testNotificationWithoutImage: InappNotification = {
  title: 'You have a new comment',
  redirectURL: 'https://www.notificationapi.com',
  date: new Date()
};

const testNotificationWithoutURL: InappNotification = {
  title: 'You have a new comment',
  imageURL: 'https://via.placeholder.com/350x150',
  date: new Date()
};

const envId = 'envId';
const userId = 'userId';

let spy: jest.SpyInstance;
beforeEach(() => {
  spy = jest.spyOn(console, 'error').mockImplementation();
});

afterEach(() => {
  document.body.innerHTML = '<div id="root"></div>';
  WS.clean();
  spy.mockRestore();
});

describe('notificationapi', () => {
  test('should exist', () => {
    expect(notificationapi).toBeDefined();
  });

  describe('init', () => {
    test('given bad root element shows error', () => {
      notificationapi.init({
        root: 'none'
      });
      expect(spy.mock.calls).toEqual([
        ['There are no HTML elements with id="none" on the page.']
      ]);
    });

    test('adds the notificationapi container to the root', () => {
      notificationapi.init({
        root: 'root'
      });
      expect($('[id="root"]').children()[0].id).toEqual(
        'notificationapi-container'
      );
    });

    test('adds the notification popup button to the container', () => {
      notificationapi.init({
        root: 'root'
      });
      expect($('[id="notificationapi-container"]').children()[0].id).toEqual(
        'notificationapi-button'
      );
    });

    describe('inline', () => {
      test('adds the notification popup to the container with .inline', () => {
        notificationapi.init({
          root: 'root',
          inline: true
        });
        expect($('#notificationapi-popup').parent().attr('id')).toEqual(
          'notificationapi-container'
        );
        expect($('#notificationapi-popup').attr('class')).toEqual('inline');
      });
    });

    describe('popup', () => {
      test('without inline, adds the notification popup to the container with .hovering.closed', () => {
        notificationapi.init({
          root: 'root'
        });
        expect($('#notificationapi-popup').parent().attr('id')).toEqual(
          'notificationapi-container'
        );
        expect($('#notificationapi-popup').hasClass('popup'));
        expect($('#notificationapi-popup').hasClass('hovering'));
        expect($('#notificationapi-popup').hasClass('closed'));
      });

      test('when button is clicked, popup has .hovering not .closed', () => {
        notificationapi.init({
          root: 'root'
        });
        $('#notificationapi-button').trigger('click');
        expect($('#notificationapi-popup').hasClass('hovering'));
        expect(!$('#notificationapi-popup').hasClass('closed'));
      });

      test('when button is clicked then clicked again, popup has .closed', () => {
        notificationapi.init({
          root: 'root'
        });
        $('#notificationapi-button').trigger('click');
        $('#notificationapi-button').trigger('click');
        expect($('#notificationapi-popup').hasClass('closed'));
      });

      test('when button is clicked then popup content is clicked, popup is not .closed', () => {
        notificationapi.init({
          root: 'root'
        });
        $('#notificationapi-button').trigger('click');
        $('#notificationapi-header').trigger('click');
        expect(!$('#notificationapi-popup').hasClass('closed'));
      });

      test('when button is clicked then page clicked, popup has .closed', () => {
        notificationapi.init({
          root: 'root'
        });
        $('#notificationapi-button').trigger('click');
        $('body').trigger('click');
        expect($('#notificationapi-popup').hasClass('closed'));
      });

      test('given bad popupPosition, throws error', () => {
        notificationapi.init({
          root: 'root',
          popupPosition: 'blah'
        });
        expect(spy.mock.calls).toEqual([
          [
            '"blah" is not a valid position. Valid positions: topLeft, topRight, leftTop, leftBottom, bottomLeft, bottomRight, rightTop, rightBottom'
          ]
        ]);
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
            popupPosition
          });
          $('#notificationapi-button').trigger('click');
        });
      });
    });

    describe('websocket connection', () => {
      test('given a websocket, connects and requests unread and notifications', async () => {
        const server = new WS('ws://localhost:1234', { jsonProtocol: true });
        notificationapi.init({
          root: 'root',
          websocket: 'ws://localhost:1234'
        });
        await server.connected;
        const req1: WS_UnreadCountRequest = {
          type: 'inapp_web/unread_count',
          payload: {
            envId,
            userId
          }
        };
        const req2: WS_NotificationsRequest = {
          type: 'inapp_web/notifications',
          payload: {
            count: 50,
            envId,
            userId
          }
        };
        await expect(server).toReceiveMessage(req1);
        await expect(server).toReceiveMessage(req2);
      });

      test('given unread count, renders it', async () => {
        const server = new WS('ws://localhost:1234', { jsonProtocol: true });
        notificationapi.init({
          root: 'root',
          websocket: 'ws://localhost:1234'
        });
        await server.connected;
        server.send({
          type: 'inapp_web/unread',
          payload: {
            count: 3
          }
        });
        expect($('#notificationapi-unread').html()).toEqual('3');
      });

      test('given notifications, renders them', async () => {
        const server = new WS('ws://localhost:1234', { jsonProtocol: true });
        notificationapi.init({
          root: 'root',
          websocket: 'ws://localhost:1234'
        });
        await server.connected;
        const message: WS_NotificationsResponse = {
          type: 'inapp_web/notifications',
          payload: { notifications: [testNotification, testNotification] }
        };
        server.send(message);
        expect($('.notificationapi-notification')).toHaveLength(2);
      });

      test('given malformed message, doesnt break', async () => {
        const server = new WS('ws://localhost:1234', { jsonProtocol: true });
        notificationapi.init({
          root: 'root',
          websocket: 'ws://localhost:1234'
        });
        await server.connected;
        server.send('test');
        expect(spy.mock.calls).toHaveLength(0);
      });

      test('after scrolling to the end, requests notifications before the oldest notification', async () => {
        const server = new WS('ws://localhost:1234', { jsonProtocol: true });
        notificationapi.init({
          root: 'root',
          websocket: 'ws://localhost:1234'
        });
        await server.connected;
        const res: WS_NotificationsResponse = {
          type: 'inapp_web/notifications',
          payload: {
            notifications: [
              testNotification,
              testNotification,
              testNotification
            ]
          }
        };
        server.send(res);
        $('#notificationapi-button').trigger('click');
        $('#notificationapi-popup-inner').scrollTop(1);
        const req3: WS_NotificationsRequest = {
          type: 'inapp_web/notifications',
          payload: {
            before: 'test',
            count: 50,
            envId: 'envId',
            userId: 'userId'
          }
        };
        console.log(server.messages);
        await expect(server).toHaveReceivedMessages([req3]);
      });
    });

    describe('rendering unread count', () => {
      test('doesnt break in inline mode', () => {
        notificationapi.init({
          root: 'root',
          inline: true
        });
        notificationapi.setUnread(123);
        expect(spy.mock.calls).toHaveLength(0);
      });

      test('given 0, is not displayed', () => {
        notificationapi.init({
          root: 'root'
        });
        notificationapi.setUnread(0);
        expect($('#notificationapi-unread').hasClass('hidden')).toBeTruthy();
      });

      test('given 1, shows 1', () => {
        notificationapi.init({
          root: 'root'
        });
        notificationapi.setUnread(1);
        expect($('#notificationapi-unread').hasClass('hidden')).toBeFalsy();
        expect($('#notificationapi-unread').html()).toEqual('1');
      });

      test('given 100, shows +99', () => {
        notificationapi.init({
          root: 'root'
        });
        notificationapi.setUnread(100);
        expect($('#notificationapi-unread').hasClass('hidden')).toBeFalsy();
        expect($('#notificationapi-unread').html()).toEqual('+99');
      });
    });

    describe('rendering notifications', () => {
      test('given none, adds no notifications', () => {
        notificationapi.init({
          root: 'root'
        });
        expect($('.notificationapi-notification')).toHaveLength(0);
      });

      test('given 2, adds 2 notifications', () => {
        notificationapi.init({
          root: 'root'
        });
        notificationapi.processNotifications([
          testNotification,
          testNotification
        ]);
        expect($('.notificationapi-notification')).toHaveLength(2);
      });

      test('given 1 notification, shows title, message, image and date with correct redirect', () => {
        notificationapi.init({
          root: 'root'
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
        expect($('.notificationapi-notification-date').text()).toEqual('now');
      });

      test('without url, does not redirect', () => {
        notificationapi.init({
          root: 'root'
        });
        notificationapi.processNotifications([testNotificationWithoutURL]);
        expect($('.notificationapi-notification').attr('href')).toBeFalsy();
      });

      test('without image, ignores image, uses icon', () => {
        notificationapi.init({
          root: 'root'
        });
        notificationapi.processNotifications([testNotificationWithoutImage]);
        expect($('.notificationapi-notification-image')).toHaveLength(0);
      });
    });

    describe('recreation', () => {
      test('does not create two inline popups', () => {
        notificationapi.init({
          root: 'root'
        });

        notificationapi.init({
          root: 'root'
        });

        expect($('[id="notificationapi-button"]').length).toEqual(1);
        expect($('[id="notificationapi-popup"]').length).toEqual(1);
      });

      test('replaces button', () => {
        notificationapi.init({
          root: 'root'
        });

        $('#notificationapi-button').addClass('to-be-found');

        notificationapi.init({
          root: 'root'
        });

        expect($('.to-be-found').length).toEqual(0);
      });

      test('replaces existing inline popup', () => {
        notificationapi.init({
          root: 'root',
          inline: true
        });
        notificationapi.processNotifications([testNotificationWithoutURL]);

        notificationapi.init({
          root: 'root',
          inline: true
        });
        notificationapi.processNotifications([testNotification]);

        expect($('.notificationapi-notification')).toHaveLength(1);
        expect($('.notificationapi-notification').attr('href')).toEqual(
          testNotification.redirectURL
        );
      });
    });
  });
});
