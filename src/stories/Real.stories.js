import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';

export default {
  title: 'Real',
  parameters: {
    viewport: {
      viewports: INITIAL_VIEWPORTS
    }
  }
};

const Component = ({ ...args }) => {
  window.NotificationAPI = require('../index').default;
  return `<div id="our-root"></div>
          <BR><BR>

          <script>
            notificationapi = new NotificationAPI({
              root: "our-root",
              userId: "${args.userId}",
              clientId: "${args.clientId}",
              popupPosition: "rightBottom"
            });
          </script>

`;
};

export const WithNotifications = Component.bind({});
WithNotifications.args = {
  clientId: '24nojpnrsdc53fkslha0roov05',
  userId: '123'
};

export const WithoutNotifications = Component.bind({});
WithoutNotifications.args = {
  clientId: '24nojpnrsdc53fkslha0roov05',
  userId: 'thisiddoesnotexist'
};

export const MobileWithNotifications = Component.bind({});
MobileWithNotifications.args = {
  clientId: '24nojpnrsdc53fkslha0roov05',
  userId: '123'
};
MobileWithNotifications.parameters = {
  viewport: {
    defaultViewport: 'iphone12promax'
  }
};

export const MobileWithoutNotifications = Component.bind({});
MobileWithoutNotifications.args = {
  clientId: '24nojpnrsdc53fkslha0roov05',
  userId: 'thisiddoesnotexist'
};
MobileWithoutNotifications.parameters = {
  viewport: {
    defaultViewport: 'iphone12promax'
  }
};
