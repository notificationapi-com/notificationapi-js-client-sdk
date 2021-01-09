import { InappNotification } from './interfaces';

require('./assets/styles.css');

declare global {
  interface Window {
    notificationapi: {
      mock: (options: MockOptions) => void;
    };
  }
}

interface MockOptions {
  buttonRoot: string;
  popupRoot?: string;
  notifications?: InappNotification[];
}

function mock(options: MockOptions) {
  const existingButton = document.getElementById('notificationapi-button');
  if (existingButton) {
    existingButton.remove();
  }

  const buttonRoot = document.getElementById(options.buttonRoot);
  if (!buttonRoot) {
    console.error(
      `There are no HTML elements with id="${options.buttonRoot}" on the page.`
    );
  }
  const button = document.createElement('button');
  button.id = 'notificationapi-button';
  button.innerHTML = `<span class="icon-bell-o"></span>`;
  buttonRoot?.appendChild(button);

  const existingPopup = document.getElementById('notificationapi-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  const popup = document.createElement('div');
  popup.id = 'notificationapi-popup';
  if (!options.popupRoot) {
    popup.classList.add('popup');
    popup.classList.add('closed');
    document.body.appendChild(popup);
  } else {
    popup.classList.add('inline');
    const popupRoot = document.getElementById(options.popupRoot);
    if (!popupRoot) {
      console.error(
        `There are no HTML elements with id="${options.popupRoot}" on the page.`
      );
    }
    popupRoot?.appendChild(popup);
  }

  // header
  const header = document.createElement('h1');
  header.innerHTML = 'Notifications';
  header.id = 'notificationapi-header';
  popup.appendChild(header);

  if (!options.notifications || options.notifications.length === 0) {
    const zeroNotifications = document.createElement('div');
    zeroNotifications.id = 'notificationapi-zero-notifications';
    zeroNotifications.innerHTML =
      "<div>You don't have any notifications!</div>";
    popup.appendChild(zeroNotifications);
  } else {
    options.notifications.map((n) => {
      const notification = document.createElement('a');
      notification.classList.add('notificationapi-notification');

      if (n.redirectURL) {
        notification.href = n.redirectURL;
      }

      const notificationImageContainer = document.createElement('div');
      notificationImageContainer.classList.add(
        'notificationapi-notification-imageContainer'
      );
      if (n.imageURL) {
        const notificationImage = document.createElement('img');
        notificationImage.classList.add('notificationapi-notification-image');
        notificationImage.src = n.imageURL;
        notificationImageContainer.appendChild(notificationImage);
      } else {
        const notificationIcon = document.createElement('span');
        notificationIcon.classList.add('icon-commenting-o');
        notificationIcon.classList.add(
          'notificationapi-notification-defaultIcon'
        );
        notificationImageContainer.appendChild(notificationIcon);
      }
      notification.appendChild(notificationImageContainer);

      const notificationMetaContainer = document.createElement('div');
      notificationMetaContainer.classList.add(
        'notificationapi-notification-metaContainer'
      );

      const notificationTitle = document.createElement('p');
      notificationTitle.classList.add('notificationapi-notification-title');
      notificationTitle.innerHTML = n.title;
      notificationMetaContainer.appendChild(notificationTitle);

      const date = document.createElement('p');
      date.classList.add('notificationapi-notification-date');
      date.innerHTML = 'now';
      notificationMetaContainer.appendChild(date);

      notification.appendChild(notificationMetaContainer);
      popup.appendChild(notification);
    });
  }
}

function initialize() {
  const client = {
    mock: mock
  };

  return client;
}

window.notificationapi = initialize();
export default window.notificationapi;
