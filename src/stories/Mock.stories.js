import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
export default {
  title: 'Mock',
  parameters: {
    viewport: {
      viewports: INITIAL_VIEWPORTS
    }
  }
};

const Template = ({ ...args }) => {
  window.NotificationAPI = require('../index').default;
  return `<div id="our-root"></div>
          <BR><BR>
          <script>
            notificationapi = new NotificationAPI(${JSON.stringify(
              args.options
            )});
            notificationapi.processNotifications(${JSON.stringify(
              args.notifications
            )});
          </script>
`;
};

let notifications = [
  {
    id: 1,
    seen: false,
    title: '<b>Moe</b> posted an update.',
    redirectURL: '#',
    imageURL:
      'https://cultivatedculture.com/wp-content/uploads/2019/12/LinkedIn-Profile-Picture-Example-Sami-Viitama%CC%88ki--414x414.jpeg',
    date: new Date('2021-01-01')
  },
  {
    id: 2,
    seen: false,
    title: '<b>Maddie</b> added you to a <b>Startups</b> group.',
    redirectURL: '#',
    date: new Date('2021-03-01')
  },
  {
    id: 3,
    seen: false,
    title:
      '<b>Shannon</b> sent you a friend request. If you do not wish to receive more friends requests from this person, you can safely ignore this.',
    imageURL:
      'https://cultivatedculture.com/wp-content/uploads/2019/12/LinkedIn-Profile-Picture-Example-Rachel-Montan%CC%83ez.jpeg',
    date: new Date()
  }
];

notifications = notifications.concat(notifications).concat(notifications);

export const PopupEmpty = Template.bind({});
PopupEmpty.args = {
  options: {
    root: 'our-root',
    mock: true
  },
  notifications: []
};

export const FixedEmpty = Template.bind({});
FixedEmpty.args = {
  options: {
    root: 'our-root',
    inline: true,
    mock: true
  },
  notifications: []
};

export const Popup = Template.bind({});
Popup.args = {
  options: {
    root: 'our-root',
    mock: true
  },
  notifications: notifications
};

export const Fixed = Template.bind({});
Fixed.args = {
  options: {
    root: 'our-root',
    inline: true,
    mock: true
  },
  notifications: notifications
};

export const MobilePopupEmpty = Template.bind({});
MobilePopupEmpty.args = {
  options: {
    root: 'our-root',
    mock: true
  },
  notifications: []
};
MobilePopupEmpty.parameters = {
  viewport: {
    defaultViewport: 'iphone12promax'
  }
};

export const MobileFixedEmpty = Template.bind({});
MobileFixedEmpty.args = {
  options: {
    root: 'our-root',
    inline: true,
    mock: true
  },
  notifications: []
};
MobileFixedEmpty.parameters = {
  viewport: {
    defaultViewport: 'iphone12promax'
  }
};

export const MobilePopup = Template.bind({});
MobilePopup.args = {
  options: {
    root: 'our-root',
    mock: true
  },
  notifications: notifications
};
MobilePopup.parameters = {
  viewport: {
    defaultViewport: 'iphone12promax'
  }
};

export const MobileFixed = Template.bind({});
MobileFixed.args = {
  options: {
    root: 'our-root',
    inline: true,
    mock: true
  },
  notifications: notifications
};
MobileFixed.parameters = {
  viewport: {
    defaultViewport: 'iphone12promax'
  }
};
