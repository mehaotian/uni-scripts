const path = require('path')
const fs = require('fs-extra')
const glob = require('glob')
const sass = require('node-sass')
const beautify = require('js-beautify')
console.log(path, fs, glob)

const uniAppInit = (uniuiPath, uniappPath, vue) => {
  console.log('同步地址:', uniuiPath, uniappPath)
  // hello uni-app 本地 static 完整地址
  const outputStaticFile = path.join(uniappPath, 'static')
  // uni-ui 本地 static 完整地址
  const inputStaticFile = path.join(uniuiPath, 'src', 'static')

  // uni-ui 本地 App.vue 完整地址
  // const appVueFile = path.join(uniuiPath, '/src/App.vue')
  // uni-ui 本地 /src/pages 完整地址
  // const inputExampleFiles = path.join(uniuiPath, '/src/pages')
  // uni-ui 本地 pages.json 完整地址
  // const inputPagesJson = path.join(uniuiPath, '/src/pages.json')
  // hello uni-app 示例目录完整地址
  // const outputExampleFiles = path.join(uniuiPath, './pages/extUI')
  // hello uni-app 本地 static 完整地址
  // const outputTabBarFile = path.join(uniappPath, './pages/tabBar/extUI/extUI.nvue')
  // 本地同步 示例页完整地址
  // const inputTabBarFile = path.join(__dirname, './extUI.nvue')

  // 1. 复制static目录到目标static目录
  fs.copy(inputStaticFile, outputStaticFile, function (err) {
    if (err) {
      vue.$Message.error({
        content: '静态文件同步失败'
      })
      return
    }
    vue.$Message.success({
      content: '同步静态文件成功'
    })
  })
  var sassContent = sass.renderSync({
    data: '.div{color:red;.p{background:#fff}}'
  })
  console.log(sassContent)
  // 2. 复制组件到对应目录
  const result = beautify.html('<p><span>123</span></p><p>456</p>', {
    indent_size: 4,
    indent_with_tabs: true
  })

  console.log(result)
}

const syncUniApp = (uniuiPath, uniappPath, vue) => {
  // 同步中禁止点击
  // vue.disabledTap = true
  vue.$Message.loading({
    content: '开始同步 uni-ui 到 Hello uni-app'
  })
  uniAppInit(uniuiPath, uniappPath, vue)
  // return
  // transformComponents(uniappPath, uniuiPath, true)
  // console.log('转化组件完成')
  // transformExample(uniappPath, uniuiPath, true)
  // console.log('转化示例完成')
  // typeof (fn) === 'function' && fn()
}

module.exports = syncUniApp
