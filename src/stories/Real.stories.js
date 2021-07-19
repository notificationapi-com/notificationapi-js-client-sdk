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
            notificationapi = new NotificationAPI(${JSON.stringify(args)});
          </script>

`;
};

export const WithNotifications = Component.bind({});
WithNotifications.args = {
  root: 'our-root',
  popupPosition: 'rightBottom',
  clientId: '24nojpnrsdc53fkslha0roov05',
  userId: '123'
};

export const WithoutNotifications = Component.bind({});
WithoutNotifications.args = {
  root: 'our-root',
  popupPosition: 'rightBottom',
  clientId: '24nojpnrsdc53fkslha0roov05',
  userId: 'thisiddoesnotexist'
};

export const MobileWithNotifications = Component.bind({});
MobileWithNotifications.args = {
  root: 'our-root',
  popupPosition: 'rightBottom',
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
  root: 'our-root',
  popupPosition: 'rightBottom',
  clientId: '24nojpnrsdc53fkslha0roov05',
  userId: 'thisiddoesnotexist'
};
MobileWithoutNotifications.parameters = {
  viewport: {
    defaultViewport: 'iphone12promax'
  }
};

export const SecureModeWrongHash = Component.bind({});
SecureModeWrongHash.args = {
  root: 'our-root',
  popupPosition: 'rightBottom',
  clientId: '24nojpnrsdc53fkslha0roov05',
  userId: '1234',
  userIdHash: 'wronghash'
};

export const SecureModeCorrectHash = Component.bind({});
SecureModeCorrectHash.args = {
  root: 'our-root',
  popupPosition: 'rightBottom',
  clientId: '24nojpnrsdc53fkslha0roov05',
  userId: '1234',
  userIdHash: 'WFDdxv6xbyNTyIPu9AfmfogfdEHhuQ3/YXw7Rblkg2E='
};
