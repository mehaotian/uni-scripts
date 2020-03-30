import Vue from 'vue'
import axios from 'axios'
// import iView from 'iview'
// import 'iview/dist/styles/iview.css'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'
import App from './App'
import router from './router'
import store from './store'
Vue.prototype.$store = store
if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
// Vue.use(AtUI)
// Vue.use(ElementUI)
Vue.use(Antd)
Vue.config.productionTip = false
/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
