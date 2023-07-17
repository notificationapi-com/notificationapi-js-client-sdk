// service-worker.test.ts

describe('Service Worker', () => {
  let mockEvent: any;
  let data: any;
  let addEventListenerMock: jest.SpyInstance;
  let mockShowNotification: jest.Mock;

  beforeEach(() => {
    data = {
      title: 'Test Title',
      message: 'Test message',
      icon: 'images/test.png',
      tag: 'test-tag'
    };

    mockEvent = {
      data: {
        json: jest.fn().mockReturnValue(data)
      },
      waitUntil: jest.fn()
    };

    mockShowNotification = jest.fn();

    // Mock the window.registration object with the showNotification method
    Object.defineProperty(window, 'registration', {
      value: {
        showNotification: mockShowNotification
      },
      writable: true,
      configurable: true
    });

    // Mock the Notification object
    Object.defineProperty(window, 'Notification', {
      value: jest.fn().mockImplementation(() => ({
        permission: 'granted'
      })),
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    jest.resetModules(); // This will ensure a fresh instance of service-worker.js for each test case
  });

  it('should add a push event listener', () => {
    addEventListenerMock = jest.spyOn(window, 'addEventListener');
    require('../assets/service-worker.js');
    expect(addEventListenerMock).toHaveBeenCalledWith(
      'push',
      expect.any(Function)
    );
  });

  it('should handle push event when Notification permission is granted', async () => {
    // Make Notification.permission writable and set it to 'denied'
    Object.defineProperty(window.Notification, 'permission', {
      value: 'granted',
      writable: true,
      configurable: true
    });
    addEventListenerMock = jest.spyOn(window, 'addEventListener');
    require('../assets/service-worker.js');
    const pushHandler = addEventListenerMock.mock.calls[0][1];
    await pushHandler(mockEvent);

    expect(mockEvent.data.json).toHaveBeenCalled();
    expect(mockShowNotification).toHaveBeenCalledWith(data.title, {
      body: data.message,
      tag: data.tag,
      icon: data.icon
    });
  });

  it('should not handle push event when Notification permission is not granted', async () => {
    // Make Notification.permission writable and set it to 'denied'
    Object.defineProperty(window.Notification, 'permission', {
      value: 'denied',
      writable: true,
      configurable: true
    });

    addEventListenerMock = jest.spyOn(window, 'addEventListener');
    require('../assets/service-worker.js');
    const pushHandler = addEventListenerMock.mock.calls[0][1];
    await pushHandler(mockEvent);

    expect(mockEvent.data.json).not.toHaveBeenCalled();
    expect(mockShowNotification).not.toHaveBeenCalled();
  });
});
