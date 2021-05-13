export default {
  title: 'Mock'
};

const Template = ({ ...args }) => {
  window.NotificationAPI = require('../index').default;
  return `<div id="our-root"></div>
          <BR><BR>
          <script>
            notificationapi = new NotificationAPI(${JSON.stringify(
              args.options
            )});
            notificationapi.processNotifications(${JSON.stringify(
              args.notifications
            )});
          </script>

          <br><br><br><br>
          <p>Series of HTML elements with default styling for comparison.</p>
          <span>span</span>
          <h1>heading 1</h1>
          <h2>heading 1</h2>
          <h3>heading 1</h3>
          <a href="something">link</a>
          <button>button</button>
`;
};

let notifications = [
  {
    id: 1,
    seen: false,
    title: '<b>Moe</b> posted an update.',
    redirectURL: '#',
    imageURL:
      'https://cultivatedculture.com/wp-content/uploads/2019/12/LinkedIn-Profile-Picture-Example-Sami-Viitama%CC%88ki--414x414.jpeg',
    date: new Date()
  },
  {
    id: 2,
    seen: false,
    title: '<b>Maddie</b> added you to a <b>Startups</b> group.',
    redirectURL: '#',
    date: new Date()
  },
  {
    id: 3,
    seen: false,
    title:
      '<b>Shannon</b> sent you a friend request. If you do not wish to receive more friends requests from this person, you can safely ignore this.',
    imageURL:
      'https://cultivatedculture.com/wp-content/uploads/2019/12/LinkedIn-Profile-Picture-Example-Rachel-Montan%CC%83ez.jpeg',
    date: new Date()
  }
];

notifications = notifications.concat(notifications).concat(notifications);

export const PopupEmpty = Template.bind({});
PopupEmpty.args = {
  options: {
    root: 'our-root',
    mock: true
  },
  notifications: []
};

export const FixedEmpty = Template.bind({});
FixedEmpty.args = {
  options: {
    root: 'our-root',
    inline: true,
    mock: true
  },
  notifications: []
};

export const Popup = Template.bind({});
Popup.args = {
  options: {
    root: 'our-root',
    mock: true
  },
  notifications: notifications
};

export const Fixed = Template.bind({});
Fixed.args = {
  options: {
    root: 'our-root',
    inline: true,
    mock: true
  },
  notifications: notifications
};
