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
  return `<div id="button"></div>
          <BR><BR>
          <div id="popup" style="width: 360px;"></div>

          <script>
            notificationapi.mock(${JSON.stringify(args.options)});
          </script>

          <br><br><br><br>
          <p>Series of HTML elements with default styling for comparison.</p>
          <span>span</span>
          <h1>heading 1</h1>
          <h2>heading 1</h2>
          <h3>heading 1</h3>
          <a href="something">link</a>
          <button>button</button>
          <style>
          * { background: lightgrey; color: blue; }
          </style>

`;
};

const notifications = [
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

export const PopupEmpty = Template.bind({});
PopupEmpty.args = {
  options: {
    buttonRoot: 'button'
  }
};

export const FixedEmpty = Template.bind({});
FixedEmpty.args = {
  options: {
    buttonRoot: 'button',
    popupRoot: 'popup'
  }
};

export const Popup = Template.bind({});
Popup.args = {
  options: {
    buttonRoot: 'button',
    notifications
  }
};

export const Fixed = Template.bind({});
Fixed.args = {
  options: {
    buttonRoot: 'button',
    popupRoot: 'popup',
    notifications
  }
};
