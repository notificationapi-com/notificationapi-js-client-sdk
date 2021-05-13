export default {
  title: 'Real'
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

export const Popup = Component.bind({});
Popup.args = {
  clientId: '24nojpnrsdc53fkslha0roov05',
  userId: '123'
};
