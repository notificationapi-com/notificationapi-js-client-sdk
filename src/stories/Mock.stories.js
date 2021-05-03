import notificationapi from '../index';

export default {
  title: 'Mock',
  argTypes: {
    label: { control: 'text' },
    primary: { control: 'boolean' },
    backgroundColor: { control: 'color' },
    size: {
      control: { type: 'select', options: ['small', 'medium', 'large'] }
    },
    onClick: { action: 'onClick' }
  }
};

const Template = ({ ...args }) => {
  return `<div id="our-root"></div>
          <BR><BR>

          <script>
            notificationapi.init(${JSON.stringify(args.options)});
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
    title: '<b>Moe</b> posted an update.',
    redirectURL: '#',
    imageURL:
      'https://cultivatedculture.com/wp-content/uploads/2019/12/LinkedIn-Profile-Picture-Example-Sami-Viitama%CC%88ki--414x414.jpeg',
    date: new Date()
  },
  {
    title: '<b>Maddie</b> added you to a <b>Startups</b> group.',
    redirectURL: '#',
    date: new Date()
  },
  {
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
    root: 'our-root'
  }
};

export const FixedEmpty = Template.bind({});
FixedEmpty.args = {
  options: {
    root: 'our-root',
    inline: true
  }
};

export const Popup = Template.bind({});
Popup.args = {
  options: {
    root: 'our-root',
    notifications
  }
};

export const Fixed = Template.bind({});
Fixed.args = {
  options: {
    root: 'our-root',
    inline: true,
    notifications
  }
};
