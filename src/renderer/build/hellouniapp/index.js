
const Util = require('./lib/utils')
const syncComponents = require('./lib/components')
const syncPages = require('./lib/pages')
const syncPagesJson = require('./lib/pagesJson')

const syncUniApp = (uniuiPath, uniappPath, vue) => {
  const util = Util.getInstance()
  util.init(uniuiPath, uniappPath, vue)
  util.vue.$Message.loading({
    content: '开始同步组件'
  })
  // 同步组件
  syncComponents(util)
  syncPages(util)
  syncPagesJson(util)
}

module.exports = syncUniApp
