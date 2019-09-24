import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import app from './modules/app'
// createSharedMutations
import { createPersistedState } from 'vuex-electron'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    app
  },
  getters,
  plugins: [
    createPersistedState()
    // createSharedMutations()
  ],
  strict: process.env.NODE_ENV !== 'production'
})

export default store
