import {Modal, Notice} from 'iview'
import syncComponents from './lib/components'
import syncPages from './lib/pages'
import syncPagesJson from './lib/pagesjson'
const Util = require('../lib/utils')

const syncUniApp = (uniuiPath, uniappPath) => {
  const util = Util.getInstance()
  util.init(uniuiPath, uniappPath)

  Modal.confirm({
    title: '提示',
    content: '是否开始同步 uni-ui 到 hello uni-app',
    loading: true,
    onOk: () => {
      Promise.all([syncComponents(util), syncPages(util), syncPagesJson(util)]).then((result) => {
        console.log('同步到 hello uni-app 成功')
        Modal.remove()
        Notice.success({
          title: '提示',
          desc: '同步到 hello uni-app 成功'
        })
        util.exists('tempCatalog').then(() => {
          console.log('删除 temp 临时目录')
        })
      })
    }
  })
  // 同步组件
}

export default syncUniApp
