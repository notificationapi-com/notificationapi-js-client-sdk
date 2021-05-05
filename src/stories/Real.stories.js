import notificationapi from '../index';

export default {
  title: 'Real'
};

const Component = ({ ...args }) => {
  return `<div id="our-root"></div>
          <BR><BR>

          <script>
            notificationapi.init({
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
