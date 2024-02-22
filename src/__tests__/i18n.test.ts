import $ from 'jquery';
import {
  NotificationAPIClientInterface,
  WS_NotificationsResponse
} from '../interfaces';
import WS from 'jest-websocket-mock';
import NotificationAPI from '../index';

const clientId = 'envId@';
const userId = 'userId@';
let notificationapi: NotificationAPIClientInterface;
let server: WS;
beforeEach(() => {
  document.body.innerHTML =
    '<div id="root"></div><div id="root2"></div><div id="somethingelse">somethingelse</div>';

  server = new WS('ws://localhost:1234', { jsonProtocol: true });
});

afterEach(() => {
  WS.clean();
  if (notificationapi) notificationapi.destroy();
});

describe('Support multiple languages', () => {
  test('The empty notification message (default behavior is english)', async () => {
    notificationapi = new NotificationAPI({
      clientId,
      userId,
      websocket: 'ws://localhost:1234'
    });
    notificationapi.showInApp({
      root: 'root'
    });
    const message: WS_NotificationsResponse = {
      route: 'inapp_web/notifications',
      payload: { notifications: [] }
    };
    server.send(message);
    expect($('.notificationapi-empty').text()).toBe(
      "You don't have any notifications!"
    );
  });
  test('The empty notification message in spanish', async () => {
    notificationapi = new NotificationAPI({
      clientId,
      userId,
      websocket: 'ws://localhost:1234',
      language: 'es-ES'
    });
    notificationapi.showInApp({
      root: 'root'
    });
    const message: WS_NotificationsResponse = {
      route: 'inapp_web/notifications',
      payload: { notifications: [] }
    };
    server.send(message);
    expect($('.notificationapi-empty').text()).toBe(
      '¡No tienes ninguna notificación!'
    );
  });
});
