import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
import '../assets/styles.css';

export default {
  title: 'InApp/Real',
  parameters: {
    viewport: {
      viewports: INITIAL_VIEWPORTS
    }
  },
  argTypes: {
    markAsReadMode: {
      control: 'select',
      options: ['AUTOMATIC', 'MANUAL', 'MANUAL_AND_CLICK']
    }
  }
};

const Component = ({ ...args }) => {
  window.NotificationAPI = require('../index').default;
  return `<div id="our-root"></div>
          <BR><BR>
          <script>
            notificationapi = new NotificationAPI(${JSON.stringify(args)});
            notificationapi.showInApp({
              root: "our-root", 
              popupPosition: "rightBottom", 
              markAsReadMode: "${args.markAsReadMode}"});
          </script>

`;
};

export const WithNotifications = Component.bind({});
WithNotifications.args = {
  clientId: '24nojpnrsdc53fkslha0roov05',
  userId: 'sahand',
  markAsReadMode: 'AUTOMATIC'
};

export const WithoutNotifications = Component.bind({});
WithoutNotifications.args = {
  clientId: '24nojpnrsdc53fkslha0roov05',
  userId: 'thisiddoesnotexist',
  markAsReadMode: 'AUTOMATIC'
};

export const MobileWithNotifications = Component.bind({});
MobileWithNotifications.args = {
  clientId: '24nojpnrsdc53fkslha0roov05',
  userId: 'sahand',
  markAsReadMode: 'AUTOMATIC'
};

MobileWithNotifications.parameters = {
  viewport: {
    defaultViewport: 'iphone12promax'
  }
};

export const MobileWithoutNotifications = Component.bind({});
MobileWithoutNotifications.args = {
  clientId: '24nojpnrsdc53fkslha0roov05',
  userId: 'thisiddoesnotexist',
  markAsReadMode: 'AUTOMATIC'
};

MobileWithoutNotifications.parameters = {
  viewport: {
    defaultViewport: 'iphone12promax'
  }
};

export const SecureModeWrongHash = Component.bind({});
SecureModeWrongHash.args = {
  clientId: '24nojpnrsdc53fkslha0roov05',
  userId: '1234',
  userIdHash: 'wronghash',
  markAsReadMode: 'AUTOMATIC'
};

export const SecureModeCorrectHash = Component.bind({});
SecureModeCorrectHash.args = {
  clientId: '24nojpnrsdc53fkslha0roov05',
  userId: '1234',
  userIdHash: 'WFDdxv6xbyNTyIPu9AfmfogfdEHhuQ3/YXw7Rblkg2E=',
  markAsReadMode: 'AUTOMATIC'
};
