# Installation

```
npm install notificationapi-js-client-sdk
```

Warning: this package is only intended for client-side (front-end) applications.

# Usage

#### 1. Import or require

```
import NotificationAPI from 'notificationapi-js-client-sdk'
```

or

```
const NotificationAPI = require('notificationapi-js-client-sdk').default
```

#### 2. Initialization

The constructor will set up and render the NotificationAPI popup notifications in your front-end. Each instantiation will create a new instance of the NotificationAPI popup, thus for performance reason it is recommended to only run it once, e.g. after page load.

```
const notificationapi = new NotificationAPI({
      root: "PARENT_ELEMENT_ID",
      clientId: CLIENT_ID,
      userId: USER_ID,
    });
```

Parameters:

- root: The ID of the parent HTML element which would contain the NotificationAPI widget.
- clientId: Your NotificationAPI account clientId. You can get this from the "API Keys" section of the dashboard.
- userId: The ID of the user in your system.
- inline: whether to render a notification button that opens a popup, or to directly render the notifications as a list. Default: false.

#### React Example

React's state management and re-rendering causes this widget to be destroyed and re-initialized with every state change. It is recommended to place this widget in a "memo"-ized component to avoid this issue. Example:

```
// NotificationAPIComponent.jsx:
import NotificationAPI from "notificationapi-js-client-sdk";
import { memo, useEffect } from "react";

const NotificationAPIComponent = memo((props) => {
  useEffect(() => {
    const notificationapi = new NotificationAPI({
      root: "notificationApiRoot",
      clientId: "CLIENT_ID",
      userId: props.userId,
    });
  });

  return <div id="notificationApiRoot"></div>;
});
export default NotificationAPIComponent;

```

```
// Parent.jsx:
import NotificationAPIComponent from "./NotificationAPIComponent";

function Parent() {
  return (
    <div>
      <NotificationAPIComponent userId="USER_ID" />
      <div> ... </div>
    </div>
  );
}

export default Parent;

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
