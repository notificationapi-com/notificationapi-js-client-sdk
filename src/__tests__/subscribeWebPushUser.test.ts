// subscribeWebPushUser.test.ts
import { subscribeWebPushUser } from '../subscribeWebPushUser';
import { Client } from '../utils/client';

jest.mock('../utils/client');

describe('subscribeWebPushUser', () => {
  let mockPushManagerSubscribe: jest.Mock;
  let mockServiceWorkerRegister: jest.Mock;
  let mockClientPost: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    mockClientPost = jest.fn();
    jest.spyOn(Client.prototype, 'post').mockImplementation(mockClientPost);

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
  });

  it('should subscribe web push user', async () => {
    const mockUserId = 'an-existing-user-id';
    const mockClientId = 'manopaakkon-users_post-user_post-1688662497802';
    const mockAppServerKey = 'mockAppServerKey';
    const mockHashUserId = 'mockHashUserId';
    const mockEndpoint = 'mockEndpoint';
    const mockKeys = { auth: 'auth', p256dh: 'p256dh' };

    mockPushManagerSubscribe.mockResolvedValue({
      toJSON: () => ({
        endpoint: mockEndpoint,
        keys: mockKeys
      })
    });

    subscribeWebPushUser(
      mockAppServerKey,
      mockClientId,
      mockUserId,
      mockHashUserId
    );

    // Add this to flush all microtasks before making assertions.
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockServiceWorkerRegister).toBeCalledWith('/notificationapi-sw.js');
    expect(mockPushManagerSubscribe).toBeCalledWith({
      userVisibleOnly: true,
      applicationServerKey: mockAppServerKey
    });
    expect(mockClientPost).toBeCalledWith({
      webPushTokens: [
        {
          sub: {
            endpoint: 'mockEndpoint',
            keys: { auth: 'auth', p256dh: 'p256dh' }
          }
        }
      ]
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

    subscribeWebPushUser(
      mockAppServerKey,
      mockClientId,
      mockUserId,
      mockHashUserId
    );

    // Add this to flush all microtasks before making assertions.
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockServiceWorkerRegister).toBeCalledWith('/notificationapi-sw.js');
    expect(mockPushManagerSubscribe).not.toHaveBeenCalled();
    expect(mockClientPost).not.toHaveBeenCalled();
  });
});
