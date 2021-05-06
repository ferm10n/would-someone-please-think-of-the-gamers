import 'roboto-fontface/css/roboto/roboto-fontface.css';
import '@mdi/font/css/materialdesignicons.css';
import Vue, { Component } from 'vue';
import VueCompositionApi from '@vue/composition-api';
import Vuetify from 'vuetify/lib/framework';
import App from './App.vue';

Vue.use(VueCompositionApi);
Vue.use(Vuetify);

const vuetify = new Vuetify({
  icons: { iconfont: 'mdi' },
  theme: {
    dark: true,
    themes: {
      dark: {
        primary: '#ff9b3d',
      },
    },
    options: {
      customProperties: true,
    },
  },
});

new Vue({
  vuetify,
  render: (h) => h(App as Component),
}).$mount('#app');
