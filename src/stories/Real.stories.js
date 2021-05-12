import NotificationAPI from '../index';
// eslint-disable-next-line no-undef
window.NotificationAPI = NotificationAPI;
let notificationapi;

export default {
  title: 'Real'
};

const Component = ({ ...args }) => {
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
