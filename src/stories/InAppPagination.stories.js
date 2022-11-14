import '../assets/styles.css';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
import { generateFakeNotifications } from './FakeNotificationGenerator';

export default {
  title: 'InApp/Paginated',
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
            notificationapi = new NotificationAPI(${JSON.stringify(args.init)});
            notificationapi.showInApp(${JSON.stringify(args.show)});
            notificationapi.websocketHandlers.notifications(${JSON.stringify(
              args.wsNotificationsResponse
            )});
          </script>

`;
};

const clientId = 'test';
const userId = 'test';
export const Zero = Component.bind({});
Zero.args = {
  init: {
    clientId,
    userId,
    websocket: false
  },
  show: {
    root: 'our-root',
    paginated: true
  },
  wsNotificationsResponse: {
    route: 'inapp_web/notifications',
    payload: {
      notifications: []
    }
  }
};

export const Three = Component.bind({});
Three.args = {
  init: {
    clientId,
    userId,
    websocket: false
  },
  show: {
    root: 'our-root',
    paginated: true
  },
  wsNotificationsResponse: {
    route: 'inapp_web/notifications',
    payload: {
      notifications: generateFakeNotifications(3)
    }
  }
};

export const Twenty = Component.bind({});
Twenty.args = {
  init: {
    clientId,
    userId,
    websocket: false
  },
  show: {
    root: 'our-root',
    paginated: true
  },
  wsNotificationsResponse: {
    route: 'inapp_web/notifications',
    payload: {
      notifications: generateFakeNotifications(20)
    }
  }
};

export const SixtyTwo = Component.bind({});
SixtyTwo.args = {
  init: {
    clientId,
    userId,
    websocket: false
  },
  show: {
    root: 'our-root',
    paginated: true
  },
  wsNotificationsResponse: {
    route: 'inapp_web/notifications',
    payload: {
      notifications: generateFakeNotifications(62)
    }
  }
};

export const CustomPageSize2 = Component.bind({});
CustomPageSize2.args = {
  init: {
    clientId,
    userId,
    websocket: false
  },
  show: {
    root: 'our-root',
    paginated: true,
    pageSize: 2
  },
  wsNotificationsResponse: {
    route: 'inapp_web/notifications',
    payload: {
      notifications: generateFakeNotifications(5)
    }
  }
};
