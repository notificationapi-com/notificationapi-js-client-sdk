// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  app: {
    buildAssetsDir: 'assets',
    baseURL: '/notificationapi-js-client-sdk/nuxt3-live/' // Set the base URL for the application
  }
});
