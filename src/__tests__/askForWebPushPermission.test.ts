import {
  NotificationAPIClientInterface,
  WS_EnvironmentDataResponse
} from '../interfaces';
import WS from 'jest-websocket-mock';
import NotificationAPI from '../index';

const clientId = 'envId@';
const userId = 'userId@';

let notificationapi: NotificationAPIClientInterface;
let server: WS;

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
        notificationapi,
        'subscribeWebPushUser'
      );
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
      notificationapi.askForWebPushPermission();

      expect(subscribeWebPushUserSpy).toHaveBeenCalledWith(
        message.payload.applicationServerKey,
        encodeURIComponent(clientId),
        encodeURIComponent(userId),
        undefined // replace with actual userIdHash if known
      );
    });
  });
});

describe('When webPushSettings handler is triggered', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let originalNotification: any;

  beforeEach(() => {
    // Save original Notification
    originalNotification = global.Notification;
  });

  afterEach(() => {
    // Reset global.Notification to its original value
    global.Notification = originalNotification;
  });

  test('setWebPushSettings is called with correct parameters if Notification.permission is granted', async () => {
    // Mock the global Notification object
    Object.defineProperty(global, 'Notification', {
      value: {
        permission: 'granted'
      },
      writable: true
    });
    const subscribeWebPushUserSpy = jest.spyOn(
      notificationapi,
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
    expect(subscribeWebPushUserSpy).toHaveBeenCalled();
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  WS.clean();
  if (notificationapi) notificationapi.destroy();
});
