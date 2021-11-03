import WS from 'jest-websocket-mock';
import NotificationAPI from '../index';
import { NotificationAPIClientInterface } from '../interfaces';

const clientId = 'envId@';
const userId = 'userId@';
const userIdHash = 'userIdHash@';

let spy: jest.SpyInstance;
let notificationapi: NotificationAPIClientInterface;

beforeEach(() => {
  spy = jest.spyOn(console, 'error').mockImplementation();
  document.body.innerHTML = '<div id="root"></div><div id="root2"></div>';
});

afterEach(() => {
  WS.clean();
  spy.mockRestore();
  if (notificationapi) notificationapi.destroy();
});

test('init returns a NotificationAPIClient object and adds to window', async () => {
  notificationapi = NotificationAPI.init({
    clientId,
    userId
  });
  expect(notificationapi).toBeTruthy();
});

test('given custom websocket, requests connection URL with UserId and envId', async () => {
  const server = new WS('ws://localhost:1234', { jsonProtocol: true });
  notificationapi = NotificationAPI.init({
    websocket: 'ws://localhost:1234',
    clientId,
    userId
  });
  let requestedURL = '';
  server.on('connection', (socket) => {
    requestedURL = socket.url;
  });
  await server.connected;
  expect(requestedURL).toBe(
    `ws://localhost:1234/?envId=${encodeURIComponent(
      clientId
    )}&userId=${encodeURIComponent(userId)}`
  );
});

test('given custom websocket & userIdHash, requests connection URL with encoded UserId, envId and userIdHash', async () => {
  const server = new WS('ws://localhost:1234', { jsonProtocol: true });
  notificationapi = NotificationAPI.init({
    websocket: 'ws://localhost:1234',
    clientId,
    userId,
    userIdHash
  });
  let requestedURL = '';
  server.on('connection', (socket) => {
    requestedURL = socket.url;
  });
  await server.connected;
  expect(requestedURL).toBe(
    `ws://localhost:1234/?envId=${encodeURIComponent(
      clientId
    )}&userId=${encodeURIComponent(userId)}&userIdHash=${encodeURIComponent(
      userIdHash
    )}`
  );
});

// TODO: test that the library will use the production websocket if not given a custom websocket

test('given websocket:false, websocket is not opened', async () => {
  notificationapi = NotificationAPI.init({
    clientId,
    userId,
    websocket: false
  });
  expect(notificationapi.websocket).toBeFalsy();
});
