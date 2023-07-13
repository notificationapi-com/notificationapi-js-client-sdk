import {
  NotificationAPIClientInterface,
  WS_EnvironmentDataRequest,
  WS_EnvironmentDataResponse
} from '../interfaces';
import WS from 'jest-websocket-mock';
import NotificationAPI from '../index';
import * as subscribeWebPushUser from '../subscribeWebPushUser';

const clientId = 'envId@';
const userId = 'userId@';

let notificationapi: NotificationAPIClientInterface;
let server: WS;
const req: WS_EnvironmentDataRequest = {
  route: 'environment/data'
};
beforeEach(async () => {
  server = new WS('ws://localhost:1234', { jsonProtocol: true });
  notificationapi = new NotificationAPI({
    clientId,
    userId,
    websocket: 'ws://localhost:1234'
  });
});

describe('When askForWebPushPermission is called', () => {
  describe('When return data form websocket api has the correct schema', () => {
    test('askForWebPushPermission calls subscribeWebPushUser from serviceWorkerRegistration with correct applicationServerKey', async () => {
      const subscribeWebPushUserSpy = jest.spyOn(
        subscribeWebPushUser,
        'subscribeWebPushUser'
      );

      notificationapi.askForWebPushPermission();
      await server.connected;
      const message: WS_EnvironmentDataResponse = {
        route: 'environment/data',
        payload: {
          logo: '',
          applicationServerKey: 'applicationServerKey',
          askForWebPushPermission: true
        }
      };
      server.send(message);
      await expect(server).toReceiveMessage(req);

      expect(subscribeWebPushUserSpy).toHaveBeenCalledWith(
        message.payload.applicationServerKey,
        encodeURIComponent(clientId),
        encodeURIComponent(userId),
        undefined // replace with actual userIdHash if known
      );
    });
  });
  describe('When return data form websocket api does not have the correct schema', () => {
    test('askForWebPushPermission does not call subscribeWebPushUser', async () => {
      const subscribeWebPushUserSpy = jest.spyOn(
        subscribeWebPushUser,
        'subscribeWebPushUser'
      );

      notificationapi.askForWebPushPermission();
      await server.connected;
      const message = {
        payload: {
          logo: '',
          applicationServerKey: 'applicationServerKey',
          askForWebPushPermission: true
        }
      };
      server.send(message);
      await expect(server).toReceiveMessage(req);

      expect(subscribeWebPushUserSpy).not.toHaveBeenCalled();
    });
  });
});

describe('When webPushSettings handler is triggered', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let originalNotification: any;

  beforeEach(() => {
    // Save original Notification
    originalNotification = global.Notification;

    // Mock the global Notification object
    Object.defineProperty(global, 'Notification', {
      value: {
        permission: 'granted'
      },
      writable: true
    });
  });

  afterEach(() => {
    // Reset global.Notification to its original value
    global.Notification = originalNotification;
  });

  test('setWebpushSettings is called with correct parameters if Notification.permission is granted', async () => {
    const setWebpushSettingsSpy = jest.spyOn(
      notificationapi,
      'setWebpushSettings'
    );

    notificationapi.askForWebPushPermission();
    await server.connected;

    const message: WS_EnvironmentDataResponse = {
      route: 'environment/data',
      payload: {
        logo: '',
        applicationServerKey: 'applicationServerKey',
        askForWebPushPermission: true
      }
    };

    server.send(message);
    await expect(server).toReceiveMessage(req);

    expect(setWebpushSettingsSpy).toHaveBeenCalledWith(
      message.payload.applicationServerKey,
      false
    );
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  WS.clean();
  if (notificationapi) notificationapi.destroy();
});
