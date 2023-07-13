import { Client } from '../utils/client';
import fetchMock from 'fetch-mock-jest';

describe('Client', () => {
  const originalFetch = global.fetch;

  beforeAll(() => {
    global.fetch = fetchMock as any;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('should post data', async () => {
    const mockData = { key: 'value' };
    const mockUrl = 'https://test-url.com';
    const mockResponse = {
      status: 200,
      body: { success: true },
      headers: { 'Content-Type': 'application/json' }
    };

    fetchMock.postOnce(mockUrl, mockResponse);

    const client = new Client({ authorization: 'Basic test', url: mockUrl });
    await client.post(mockData);

    expect(fetchMock).toHaveBeenCalledWith(mockUrl, {
      body: JSON.stringify(mockData),
      headers: expect.objectContaining({
        'content-type': 'application/json',
        Authorization: 'Basic test'
      }),
      method: 'POST'
    });
  });
});
