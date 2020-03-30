import { Modal, notification } from 'ant-design-vue'
import syncComponents from './lib/components'
import syncPages from './lib/pages'
import syncPagesJson from './lib/pagesjson'
const Util = require('../lib/utils')

const syncUniApp = (uniuiPath, uniappPath) => {
  return new Promise((resolve, reject) => {
    const util = Util.getInstance()
    util.init(uniuiPath, uniappPath)
    const modal = Modal.confirm({
      title: '提示',
      content: '是否开始同步 uni-ui 到 hello uni-app',
      loading: true,
      onOk: () => {
        notification.info({
          message: '提示',
          description: '开始同步到 hello uni-app'
        })
        Promise.all([syncComponents(util), syncPages(util), syncPagesJson(util)]).then((result) => {
          console.log('---- 同步到 hello uni-app 成功 ----')
          modal.destroy()
          notification.success({
            message: '提示',
            description: '同步到 hello uni-app 成功'
          })
          resolve()
        })
      },
      onCancel: (err) => {
        modal.destroy()
        reject(err)
      }
    })
  })
}

export default syncUniApp
