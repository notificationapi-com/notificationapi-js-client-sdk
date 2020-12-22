import notificationapi from '../index';
import * as $ from 'jquery';

beforeEach(() => {
  document.body.innerHTML = '<div id="notifications"></div>';
});

describe('notificationapi', () => {
  test('should exist', () => {
    expect(notificationapi).toBeDefined();
  });

  describe('mock', () => {
    test('given bad button root element shows error', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();
      notificationapi.mock({
        buttonRoot: 'none'
      });
      expect(spy.mock.calls).toEqual([
        ['There are no HTML elements with id="none" on the page.']
      ]);
      spy.mockRestore();
    });

    test('adds the notification popup button to the button root', () => {
      notificationapi.mock({
        buttonRoot: 'notifications'
      });
      expect($('#notifications').children()).toHaveLength(1);
      expect($('#notifications').children()[0].id).toEqual(
        'notificationapi-button'
      );
    });
  });
});
