import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
export default {
  title: 'Positioning',
  parameters: {
    viewport: {
      viewports: INITIAL_VIEWPORTS
    },
    layout: 'centered'
  },
  argTypes: {
    position: {
      control: {
        type: 'select',
        options: [
          'topLeft',
          'topRight',
          'leftTop',
          'leftBottom',
          'bottomLeft',
          'bottomRight',
          'rightTop',
          'rightBottom'
        ]
      }
    }
  }
};

const Template2 = ({ ...args }) => {
  window.NotificationAPI = require('../index').default;
  return `<div id="our-root"></div>
          <BR><BR>

          <script>
            notificationapi = NotificationAPI.init({
              mock: true
            });
            notificationapi.showInApp({
              root: "our-root",
              popupPosition: "${args.position ?? 'topLeft'}"
            })
            notificationapi.processNotifications(${JSON.stringify(
              notifications
            )})
            notificationapi.openInAppPopup();
          </script>
`;
};

const notification = {
  title: '<b>Moe</b> posted an update.',
  redirectURL: '#',
  imageURL: 'https://picsum.photos/200',
  date: new Date()
};
let notifications = [];

for (let i = 0; i < 30; i++) {
  notifications = notifications.concat([
    {
      ...notification,
      id: Math.round(Math.random() * 1000)
    }
  ]);
}

export const PopupDirection = Template2.bind({});

export const MobilePopupDirection = Template2.bind({});
MobilePopupDirection.parameters = {
  viewport: {
    defaultViewport: 'iphone12promax'
  }
};
