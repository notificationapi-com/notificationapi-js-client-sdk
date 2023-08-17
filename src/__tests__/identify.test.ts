import NotificationAPIClient from '..';
import { NotificationAPIClientInterface } from '../interfaces';

// Mocking the fetch API
global.fetch = jest.fn();
const fetchMock = global.fetch as jest.Mock;

const clientId = 'env:Id';
const userId = 'user:Id';

let spy: jest.SpyInstance;
let notificationapi: NotificationAPIClientInterface;

beforeEach(() => {
  spy = jest.spyOn(console, 'error').mockImplementation();
  notificationapi = new NotificationAPIClient({
    clientId,
    userId
  });
});

afterEach(() => {
  spy.mockRestore();
  if (notificationapi) notificationapi.destroy();
});

describe('when identify is called', () => {
  it('returns error when userIds do not match', async () => {
    notificationapi.identify({
      id: 'somethingelse'
    });

    expect(spy.mock.calls).toEqual([
      [
        'The userId "somethingelse" does not match the userId "user:Id" provided in the init options. Cancelling action to prevent mistakes.'
      ]
    ]);
  });

  it('sends 1 API request', async () => {
    notificationapi.identify({
      email: 'something'
    });

    expect(fetchMock).toBeCalledTimes(1);
  });

  it('sends API request to the right url', async () => {
    notificationapi.identify({
      email: 'something'
    });

    expect(fetchMock.mock.calls[0][0]).toEqual(
      `https://api.notificationapi.com/${encodeURIComponent(
        clientId
      )}/users/${encodeURIComponent(userId)}`
    );
  });

  it('sends POST request', async () => {
    notificationapi.identify({
      email: 'something'
    });

    expect(fetchMock.mock.calls[0][1]['method']).toEqual('POST');
  });

  it('asks for json in header', async () => {
    notificationapi.identify({
      email: 'something'
    });

    expect(fetchMock.mock.calls[0][1]['headers']['content-type']).toEqual(
      'application/json'
    );
  });

  it('sends adds auth header correctly', async () => {
    notificationapi.identify({
      email: 'something'
    });

    expect(fetchMock.mock.calls[0][1]['headers']['Authorization']).toEqual(
      'Basic ' +
        btoa(`${encodeURIComponent(clientId)}:${encodeURIComponent(userId)}:`)
    );
  });

  it('passes the request params as body', async () => {
    notificationapi.identify({
      email: 'something'
    });

    expect(fetchMock.mock.calls[0][1]['body']).toEqual(
      JSON.stringify({ email: 'something' })
    );
  });
});
