// subscribeWebPushUser.test.ts
import NotificationAPI from '../index';
import {
  NotificationAPIClientInterface,
  WS_EnvironmentDataResponse
} from '../interfaces';
import WS from 'jest-websocket-mock';
// Mocking the fetch API
global.fetch = jest.fn();
const clientId = 'envId@';
const userId = 'userId@';
const mockAppServerKey = 'mockAppServerKey';
const mockHashUserId = 'mockHashUserId';
const mockEndpoint = 'mockEndpoint';
const mockKeys = { auth: 'auth', p256dh: 'p256dh' };
const headers = {
  'content-type': 'application/json',
  Authorization:
    'Basic ' +
    btoa(
      `${encodeURIComponent(clientId)}:${encodeURIComponent(
        userId
      )}:${encodeURIComponent(mockHashUserId)}`
    )
};
const body = {
  webPushTokens: [
    {
      sub: {
        endpoint: mockEndpoint,
        keys: mockKeys
      }
    }
  ]
};
const url = `https://api.notificationapi.com/${encodeURIComponent(
  clientId
)}/users/${encodeURIComponent(userId)}`;
describe('askForWebPushPermission', () => {
  let mockPushManagerSubscribe: jest.Mock;
  let mockServiceWorkerRegister: jest.Mock;
  let notificationapi: NotificationAPIClientInterface;
  beforeEach(() => {
    const server = new WS('ws://localhost:1234', { jsonProtocol: true });

    const res: WS_EnvironmentDataResponse = {
      route: 'environment/data',
      payload: {
        logo: 'string',
        applicationServerKey: mockAppServerKey,
        askForWebPushPermission: true
      }
    };

    jest.clearAllMocks();
    jest.resetModules();

    mockPushManagerSubscribe = jest.fn();
    mockServiceWorkerRegister = jest.fn().mockResolvedValue({
      pushManager: {
        subscribe: mockPushManagerSubscribe
      }
    });

    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: mockServiceWorkerRegister
      },
      configurable: true
    });

    global.Notification = {
      requestPermission: jest.fn().mockResolvedValue('granted')
    } as any;

    (global.fetch as jest.Mock).mockReset();
    notificationapi = new NotificationAPI({
      clientId,
      userId,
      userIdHash: mockHashUserId,
      websocket: 'ws://localhost:1234'
    });
    server.connected;
    server.send(res);
  });
  afterEach(() => {
    WS.clean();
    if (notificationapi) notificationapi.destroy();
  });
  it('should subscribe web push user', async () => {
    mockPushManagerSubscribe.mockResolvedValue({
      toJSON: () => ({
        endpoint: mockEndpoint,
        keys: mockKeys
      })
    });
    (global.fetch as jest.Mock).mockResolvedValue({ status: 200 });
    notificationapi.askForWebPushPermission();
    // Add this to flush all microtasks before making assertions.
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockServiceWorkerRegister).toBeCalledWith(
      '/notificationapi-service-worker.js'
    );
    expect(mockPushManagerSubscribe).toBeCalledWith({
      userVisibleOnly: true,
      applicationServerKey: mockAppServerKey
    });
    expect(global.fetch as jest.Mock).toHaveBeenCalledWith(url, {
      body: JSON.stringify(body),
      headers: headers,
      method: 'POST'
    });
  });
  it('should not subscribe web push user if permission not granted', async () => {
    // Mock Notification.requestPermission to return 'denied'
    global.Notification.requestPermission = jest
      .fn()
      .mockResolvedValue('denied');

    notificationapi.askForWebPushPermission();

    // Add this to flush all microtasks before making assertions.
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockServiceWorkerRegister).toBeCalledWith(
      '/notificationapi-service-worker.js'
    );
    expect(mockPushManagerSubscribe).not.toHaveBeenCalled();
    expect(global.fetch as jest.Mock).not.toHaveBeenCalled();
  });
});
