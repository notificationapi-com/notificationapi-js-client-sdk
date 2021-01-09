import notificationapi from '../index';
import * as $ from 'jquery';
import { InappNotification } from '../interfaces';

const testNotification: InappNotification = {
  title: 'You have a new comment',
  redirectURL: 'https://www.notificationapi.com',
  imageURL: 'https://via.placeholder.com/350x150',
  date: new Date()
};

const testNotificationWithoutImage: InappNotification = {
  title: 'You have a new comment',
  redirectURL: 'https://www.notificationapi.com',
  date: new Date()
};

const testNotificationWithoutURL: InappNotification = {
  title: 'You have a new comment',
  imageURL: 'https://via.placeholder.com/350x150',
  date: new Date()
};

beforeEach(() => {
  document.body.innerHTML =
    '<div id="buttonRoot"></div><div id="popupRoot"></div>';
});

describe('notificationapi', () => {
  test('should exist', () => {
    expect(notificationapi).toBeDefined();
  });

  describe('mock', () => {
    test('shows notifications header', () => {
      notificationapi.mock({
        buttonRoot: 'buttonRoot'
      });
    });

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
        buttonRoot: 'buttonRoot'
      });
      expect($('[id="buttonRoot"]').children()).toHaveLength(1);
      expect($('[id="buttonRoot"]').children()[0].id).toEqual(
        'notificationapi-button'
      );
    });

    describe('inline popup', () => {
      test('given bad popup root element shows error', () => {
        const spy = jest.spyOn(console, 'error').mockImplementation();
        notificationapi.mock({
          buttonRoot: 'buttonRoot',
          popupRoot: 'none'
        });
        expect(spy.mock.calls).toEqual([
          ['There are no HTML elements with id="none" on the page.']
        ]);
        spy.mockRestore();
      });

      test('adds the notification popup to the root with .inline', () => {
        notificationapi.mock({
          buttonRoot: 'buttonRoot',
          popupRoot: 'popupRoot'
        });
        expect($('#notificationapi-popup').parent().attr('id')).toEqual(
          'popupRoot'
        );
        expect($('#notificationapi-popup').attr('class')).toEqual('inline');
      });
    });

    describe('popup popup', () => {
      test('without popup root, adds the notification popup to the body with .hovering.closed', () => {
        notificationapi.mock({
          buttonRoot: 'buttonRoot'
        });
        expect($('#notificationapi-popup').parent().prop('nodeName')).toEqual(
          'BODY'
        );
        expect($('#notificationapi-popup').attr('class')).toEqual(
          'popup closed'
        );
      });
    });

    describe('notifications', () => {
      test('given none, adds no notifications', () => {
        notificationapi.mock({
          buttonRoot: 'notifications',
          popupRoot: 'popupRoot'
        });
        expect($('.notificationapi-notification')).toHaveLength(0);
      });

      test('given 2, adds 2 notifications', () => {
        notificationapi.mock({
          buttonRoot: 'buttonRoot',
          popupRoot: 'popupRoot',
          notifications: [testNotification, testNotification]
        });
        expect($('.notificationapi-notification')).toHaveLength(2);
      });

      test('given 1 notification, shows title, message, image and date with correct redirect', () => {
        notificationapi.mock({
          buttonRoot: 'buttonRoot',
          popupRoot: 'popupRoot',
          notifications: [testNotification]
        });
        expect($('.notificationapi-notification').attr('href')).toEqual(
          testNotification.redirectURL
        );
        expect($('.notificationapi-notification-title').text()).toEqual(
          testNotification.title
        );
        expect($('.notificationapi-notification-image').attr('src')).toEqual(
          testNotification.imageURL
        );
        expect($('.notificationapi-notification-date').text()).toEqual('now');
      });

      test('without url, does not redirect', () => {
        notificationapi.mock({
          buttonRoot: 'buttonRoot',
          popupRoot: 'popupRoot',
          notifications: [testNotificationWithoutURL]
        });
        expect($('.notificationapi-notification').attr('href')).toBeFalsy();
      });

      test('without image, ignores image, uses icon', () => {
        notificationapi.mock({
          buttonRoot: 'buttonRoot',
          popupRoot: 'popupRoot',
          notifications: [testNotificationWithoutImage]
        });
        expect($('.notificationapi-notification-image')).toHaveLength(0);
      });
    });

    describe('recreation', () => {
      test('does not create two inline popups', () => {
        notificationapi.mock({
          buttonRoot: 'buttonRoot',
          popupRoot: 'popupRoot'
        });

        notificationapi.mock({
          buttonRoot: 'buttonRoot',
          popupRoot: 'popupRoot'
        });

        expect($('[id="notificationapi-button"]').length).toEqual(1);
        expect($('[id="notificationapi-popup"]').length).toEqual(1);
      });

      test('replaces button', () => {
        notificationapi.mock({
          buttonRoot: 'buttonRoot',
          popupRoot: 'popupRoot'
        });

        $('#notificationapi-button').addClass('to-be-found');

        notificationapi.mock({
          buttonRoot: 'buttonRoot',
          popupRoot: 'popupRoot'
        });

        expect($('.to-be-found').length).toEqual(0);
      });

      test('replaces existing inline popup', () => {
        notificationapi.mock({
          buttonRoot: 'buttonRoot',
          popupRoot: 'popupRoot',
          notifications: [testNotificationWithoutURL]
        });

        notificationapi.mock({
          buttonRoot: 'buttonRoot',
          popupRoot: 'popupRoot',
          notifications: [testNotification]
        });

        expect($('.notificationapi-notification')).toHaveLength(1);
        expect($('.notificationapi-notification').attr('href')).toEqual(
          testNotification.redirectURL
        );
      });
    });
  });
});
