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
  return `<div id="notifications">
          <div>
          <script>
          notificationapi.mock({
            buttonRoot: 'root'
          });
          </script>
`;
};

export const Mock = Template.bind({});
