<template>
  <div ref="containerRef" id="container"></div>
</template>

<script>
import NotificationAPI from 'notificationapi-js-client-sdk';
import { PopupPosition } from 'notificationapi-js-client-sdk/lib/interfaces';
import 'notificationapi-js-client-sdk/dist/styles.css';
export default {
  name: 'NotificationAPIComponent',
  mounted() {
    this.notificationapi = new NotificationAPI({
      clientId: '54jas9ae4omlbbq3s0u0d9spui',
      userId: 'sahand'
    });

    this.notificationapi.showInApp({
      root: 'container', // Use the ref as the root element
      popupPosition: PopupPosition.BottomRight
    });
  }
};
</script>
<style scoped>
#container {
  text-align: center;
}
</style>
