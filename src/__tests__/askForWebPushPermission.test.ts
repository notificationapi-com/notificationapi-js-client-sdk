import {
  NotificationAPIClientInterface,
  WS_EnvironmentDataRequest,
  WS_EnvironmentDataResponse
} from '../interfaces';
import WS from 'jest-websocket-mock';
import NotificationAPI from '../index';
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
    });
  });
  describe('When return data form websocket api does not have the correct schema', () => {
    test('askForWebPushPermission calls subscribeWebPushUser from serviceWorkerRegistration with correct applicationServerKey', async () => {
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
    });
  });
});
afterEach(() => {
  WS.clean();
  if (notificationapi) notificationapi.destroy();
});
