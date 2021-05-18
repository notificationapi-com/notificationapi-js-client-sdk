# Installation

```
// using NPM:
npm install notificationapi-js-client-sdk

// or YARN:
yarn add notificationapi-js-client-sdk
```

Warning: this package is only intended for client-side (front-end) applications.

# Usage

## 1. Import or Require

```bash
# using import:
import NotificationAPI from 'notificationapi-js-client-sdk'

# or using require:
const NotificationAPI = require('notificationapi-js-client-sdk').default
```

## 2. Initialize

The example below creates a NotificationAPI widget in the container div. The widget automatically connects to our servers and pulls the notifications for user specified by the USER_ID.

```javascript
new NotificationAPI({
  root: 'container',
  clientId: YOU_CLIENT_ID,
  userId: USER_ID
});
```

```html
<div id="container"></div>
```

![Sample](https://github.com/notificationapi-com/notificationapi-js-client-sdk/blob/master/sample/popup.gif?raw=true)

Parameters:

- **root (required)**: The ID of the HTML element that will contain the NotificationAPI widget.

- **clientId (required)**: Your NotificationAPI account clientId. You can get this from the "API Keys" section of the dashboard.

- **userId (required)**: The ID of the user in your system. Same as the user ID used to trigger notifications in the back-end NotificationAPI SDK.

- **popupPosition (optional)**: The position of the notifications popup relative to the button. Valid options: topLeft, topRight, bottomLeft, bottomRight, leftTop, leftBottom, rightTop, rightBottom. Default: RightBottom.

- **inline (optional)**: whether to render a notification bell button that opens a popup, or to directly render the notifications as a list. Default: false.

Warning: Each instantiation will create a new instance of this widget, thus for performance reason it is recommended to only run it once, e.g. after page load. React users should read below.

# Usage in React

React's state management and re-rendering causes this widget to be destroyed and re-initialized with every state change. To avoid this issue, place the initialization and container element in a "memo"-ized React component. Example:

`NotificationAPIComponent.jsx`

```javascript
import NotificationAPI from 'notificationapi-js-client-sdk';
import { memo, useEffect } from 'react';

const NotificationAPIComponent = memo((props) => {
  useEffect(() => {
    new NotificationAPI({
      root: 'container',
      clientId: YOUR_CLIENT_ID,
      userId: props.userId
    });
  });

  return <div id="container"></div>;
});
export default NotificationAPIComponent;
```

`App.jsx`

```javascript
import NotificationAPIComponent from './NotificationAPIComponent';

function App() {
  return (
    <div>
      <NotificationAPIComponent userId="USER_ID" />
      <div> ... </div>
    </div>
  );
}

export default App;
```

# Development

1. Install dependencies:

```
npm install
```

2. Run in storybook:

```
npm run storybook
```

3. Run tests:

```
npm run test
```

100% code coverage required.
