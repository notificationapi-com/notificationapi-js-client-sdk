// subscribeWebPushUser.test.ts
import NotificationAPI from '../index';
import { NotificationAPIClientInterface } from '../interfaces';
// Mocking the fetch API
global.fetch = jest.fn();
const clientId = 'envId@';
const userId = 'userId@';
describe('subscribeWebPushUser', () => {
  let mockPushManagerSubscribe: jest.Mock;
  let mockServiceWorkerRegister: jest.Mock;
  let notificationapi: NotificationAPIClientInterface;
  beforeEach(() => {
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
      websocket: 'ws://localhost:1234'
    });
  });

  it('should subscribe web push user', async () => {
    const mockUserId = 'an-existing-user-id';
    const mockClientId = 'manopaakkon-users_post-user_post-1688662497802';
    const mockAppServerKey = 'mockAppServerKey';
    const mockHashUserId = 'mockHashUserId';
    const mockEndpoint = 'mockEndpoint';
    const mockKeys = { auth: 'auth', p256dh: 'p256dh' };
    const headers = {
      'content-type': 'application/json',
      Authorization:
        'Basic ' + btoa(`${mockClientId}:${mockUserId}:${mockHashUserId}`)
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
    const url = `https://api.notificationapi.com/${mockClientId}/users/${mockUserId}`;
    mockPushManagerSubscribe.mockResolvedValue({
      toJSON: () => ({
        endpoint: mockEndpoint,
        keys: mockKeys
      })
    });
    (global.fetch as jest.Mock).mockResolvedValue({ status: 200 });
    notificationapi.subscribeWebPushUser(
      mockAppServerKey,
      mockClientId,
      mockUserId,
      mockHashUserId
    );
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
    const mockUserId = 'mockUserId';
    const mockClientId = 'mockClientId';
    const mockAppServerKey = 'mockAppServerKey';
    const mockHashUserId = 'mockHashUserId';

    // Mock Notification.requestPermission to return 'denied'
    global.Notification.requestPermission = jest
      .fn()
      .mockResolvedValue('denied');

    notificationapi.subscribeWebPushUser(
      mockAppServerKey,
      mockClientId,
      mockUserId,
      mockHashUserId
    );

    // Add this to flush all microtasks before making assertions.
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockServiceWorkerRegister).toBeCalledWith(
      '/notificationapi-service-worker.js'
    );
    expect(mockPushManagerSubscribe).not.toHaveBeenCalled();
    expect(global.fetch as jest.Mock).not.toHaveBeenCalled();
  });
});
