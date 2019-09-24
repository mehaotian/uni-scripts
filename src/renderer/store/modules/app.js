const state = {
  historyList: []
}

const mutations = {
  SETHISTORY: (state, history) => {
    state.historyList = history
  },
  REMOVEHISTORY (state) {
    state.historyList = []
  }
}
const actions = {
  setHistory ({ commit }, history) {
    console.log(history)
    commit('SETHISTORY', history)
  },
  removeHistory ({ commit }) {
    commit('REMOVEHISTORY')
  }
}
export default {
  namespaced: true,
  state,
  mutations,
  actions
}
