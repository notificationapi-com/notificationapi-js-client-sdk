require('./styles.css');
require('../assets/icons.css');

declare global {
  interface Window {
    notificationapi: {
      mock: (options: MockOptions) => void;
    };
  }
}

interface MockOptions {
  buttonRoot: string;
}

function mock(options: MockOptions): Node {
  const rootEl = document.getElementById(options.buttonRoot);
  if (!rootEl) {
    console.error(
      `There are no HTML elements with id="${options.buttonRoot}" on the page.`
    );
  }
  const buttonEl = document.createElement('button');
  buttonEl.id = 'notificationapi-button';
  buttonEl.innerHTML = `<span class="icon-bell-o"></span>`;
  rootEl?.appendChild(buttonEl);

  const panelEl = document.createElement('div');
  panelEl.

  return buttonEl;
}

function initialize() {
  const client = {
    mock: mock
  };

  return client;
}

window.notificationapi = initialize();
export default window.notificationapi;
