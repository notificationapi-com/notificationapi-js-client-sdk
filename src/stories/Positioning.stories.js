import NotificationAPI from '../index';
// eslint-disable-next-line no-undef
window.NotificationAPI = NotificationAPI;
let notificationapi;

export default {
  title: 'Positioning',
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
  return `<div id="our-root" style="position: absolute; left: 50%; top: 40vh; width: 400px; height: 400px;"></div>
          <BR><BR>

          <script>
            notificationapi = new NotificationAPI({
              root: "our-root",
              popupPosition: "${args.position ?? 'topLeft'}"
            });
            notificationapi.processNotifications(${JSON.stringify(
              notifications
            )})
            notificationapi.openPopup();
          </script>

`;
};

const notifications = [
  {
    id: '1',
    title: '<b>Moe</b> posted an update.',
    redirectURL: '#',
    imageURL:
      'https://cultivatedculture.com/wp-content/uploads/2019/12/LinkedIn-Profile-Picture-Example-Sami-Viitama%CC%88ki--414x414.jpeg',
    date: new Date()
  },
  {
    id: '2',
    title: '<b>Maddie</b> added you to a <b>Startups</b> group.',
    redirectURL: '#',
    date: new Date()
  },
  {
    id: '3',
    title:
      '<b>Shannon</b> sent you a friend request. If you do not wish to receive more friends requests from this person, you can safely ignore this.',
    imageURL:
      'https://cultivatedculture.com/wp-content/uploads/2019/12/LinkedIn-Profile-Picture-Example-Rachel-Montan%CC%83ez.jpeg',
    date: new Date()
  }
];

export const TopLeft = Template2.bind({});
