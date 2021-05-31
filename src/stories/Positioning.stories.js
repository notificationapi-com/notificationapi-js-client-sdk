import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
export default {
  title: 'Positioning',
  parameters: {
    viewport: {
      viewports: INITIAL_VIEWPORTS
    }
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
  return `<div id="our-root" style="position: absolute; left: 50%; top: 40vh; width: 400px; height: 400px;"></div>
          <BR><BR>

          <script>
            notificationapi = new NotificationAPI({
              root: "our-root",
              mock: true,
              popupPosition: "${args.position ?? 'topLeft'}"
            });
            notificationapi.processNotifications(${JSON.stringify(
              notifications
            )})
            notificationapi.openPopup();
          </script>

          <div style="min-height: 2000px;">
          </div>
`;
};

const notification = {
  title: '<b>Moe</b> posted an update.',
  redirectURL: '#',
  imageURL:
    'https://cultivatedculture.com/wp-content/uploads/2019/12/LinkedIn-Profile-Picture-Example-Sami-Viitama%CC%88ki--414x414.jpeg',
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
