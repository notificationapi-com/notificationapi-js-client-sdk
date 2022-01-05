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
              args.initOptions
            )});
            notificationapi.showInApp(${JSON.stringify(args.inappOptions)})
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
    imageURL: 'https://picsum.photos/200',
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
    imageURL: 'https://picsum.photos/200',
    date: new Date()
  }
];

notifications = notifications.concat(notifications).concat(notifications);

export const PopupEmpty = Template.bind({});
PopupEmpty.args = {
  initOptions: {
    mock: true
  },
  inappOptions: {
    root: 'our-root'
  },
  notifications: []
};

export const FixedEmpty = Template.bind({});
FixedEmpty.args = {
  initOptions: {
    mock: true
  },
  inappOptions: {
    root: 'our-root',
    inline: true
  },
  notifications: []
};

export const Popup = Template.bind({});
Popup.args = {
  initOptions: {
    mock: true
  },
  inappOptions: {
    root: 'our-root'
  },
  notifications: notifications
};

export const Fixed = Template.bind({});
Fixed.args = {
  initOptions: {
    mock: true
  },
  inappOptions: {
    root: 'our-root',
    inline: true
  },
  notifications: notifications
};

export const MobilePopupEmpty = Template.bind({});
MobilePopupEmpty.args = {
  initOptions: {
    mock: true
  },
  inappOptions: {
    root: 'our-root'
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
  initOptions: {
    mock: true
  },
  inappOptions: {
    root: 'our-root',
    inline: true
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
  initOptions: {
    mock: true
  },
  inappOptions: {
    root: 'our-root'
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
  initOptions: {
    mock: true
  },
  inappOptions: {
    root: 'our-root',
    inline: true
  },
  notifications: notifications
};
MobileFixed.parameters = {
  viewport: {
    defaultViewport: 'iphone12promax'
  }
};
