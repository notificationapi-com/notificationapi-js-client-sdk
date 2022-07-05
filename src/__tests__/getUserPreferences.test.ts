import {
  NotificationAPIClientInterface,
  WS_UnreadCountResponse,
  WS_UserPreferencesRequest,
  WS_UserPreferencesResponse
} from '../interfaces';
import WS from 'jest-websocket-mock';
import NotificationAPI from '../index';

const clientId = 'envId@';
const userId = 'userId@';

let spy: jest.SpyInstance;
let notificationapi: NotificationAPIClientInterface;
let server: WS;

beforeEach(() => {
  spy = jest.spyOn(console, 'error').mockImplementation();
  server = new WS('ws://localhost:1235', { jsonProtocol: true });
  notificationapi = new NotificationAPI({
    clientId,
    userId,
    websocket: 'ws://localhost:1235'
  });
});

afterEach(() => {
  WS.clean();
  spy.mockRestore();
  if (notificationapi) notificationapi.destroy();
});

describe('given connection is already open', () => {
  beforeEach(async () => {
    await server.connected;
  });
  test('sends a user_preferences/preferences message', async () => {
    notificationapi.getUserPreferences();
    const request: WS_UserPreferencesRequest = {
      route: 'user_preferences/get_preferences'
    };
    await expect(server).toReceiveMessage(request);
  });

  test('resolves and returns the payload of the user_preferences response', async () => {
    const response: WS_UserPreferencesResponse = {
      route: 'user_preferences/preferences',
      payload: {
        userPreferences: []
      }
    };
    server.nextMessage.then(() => server.send(response));
    const result = await notificationapi.getUserPreferences();
    expect(result).toEqual([]);
  });

  test('does not resolve with other messages', async () => {
    const response1: WS_UnreadCountResponse = {
      route: 'inapp_web/unread_count',
      payload: {
        count: 0
      }
    };
    const response2: WS_UserPreferencesResponse = {
      route: 'user_preferences/preferences',
      payload: {
        userPreferences: []
      }
    };
    notificationapi.getUserPreferences().then((result) => {
      expect(result).toEqual([]);
    });
    await server.send(response1);
    await new Promise((resolve) => setTimeout(resolve, 200));
    await server.send(response2);
  });
});

describe('given connection is not open yet', () => {
  test('sends request and resolves after connection is open', async () => {
    const response: WS_UserPreferencesResponse = {
      route: 'user_preferences/preferences',
      payload: {
        userPreferences: []
      }
    };
    server.nextMessage.then((message) => {
      expect(message).toEqual({
        route: 'user_preferences/get_preferences'
      });
      server.send(response);
    });
    const result = await notificationapi.getUserPreferences();
    expect(result).toEqual([]);
  });
});

describe('given no websocket', () => {
  test('rejects the promise', async () => {
    notificationapi = new NotificationAPI({
      clientId: '',
      userId: '',
      websocket: false
    });
    notificationapi.getUserPreferences().catch((error) => {
      expect(error).toEqual('Websocket is not present.');
    });
  });
});
