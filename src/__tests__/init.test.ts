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

test('init returns a NotificationAPIClient object', async () => {
  notificationapi = NotificationAPI.init({
    clientId,
    userId
  });
  expect(notificationapi).toBeTruthy();
});

test('maintains 2 separate instances given different clientId/userId', async () => {
  const server1 = new WS('ws://localhost:1234', { jsonProtocol: true });
  const server2 = new WS('ws://localhost:1235', { jsonProtocol: true });
  let connections1 = 0;
  let connections2 = 0;
  server1.on('connection', () => {
    connections1++;
  });
  server2.on('connection', () => {
    connections2++;
  });
  notificationapi = NotificationAPI.init({
    clientId,
    userId,
    websocket: 'ws://localhost:1234'
  });

  NotificationAPI.init({
    clientId,
    userId,
    websocket: 'ws://localhost:1235'
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));
  expect(connections1).toEqual(1);
  expect(connections2).toEqual(1);
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

test('given mock option, websocket is not used', async () => {
  const server = new WS('ws://localhost:1234', { jsonProtocol: true });
  notificationapi = NotificationAPI.init({
    clientId,
    userId,
    mock: true,
    websocket: 'ws://localhost:1234'
  });
  let connected = false;
  server.on('connection', () => {
    connected = true;
  });
  await new Promise((resolve) => setTimeout(resolve, 1000)); // wait 1s

  expect(connected).toBeFalsy();
});
