// import {Message} from 'iview'
const path = require('path')
const glob = require('glob')
const beautify = require('js-beautify')
const postCss = require('@/build/lib/postcss')
const fs = require('fs-extra')

const syncPage = (util) => {
  return new Promise((resolve) => {
    let pagesReaddirFiles = glob.sync(util.path.uniUiPagesFiles + '/**/*.{nvue,vue}')
    // 开始之前先删除 uni-app 目录的 extUI 目录
    return util.exists('outputExampleFiles').then(() => {
      pagesReaddirFiles.reduce((promise, name) => {
        return promise.then(() => {
          let relativePath = path.relative(util.path.uniUiPagesFiles, name)
          let dest = util.pathjoin('outputExampleFiles', relativePath)
          // 处理 extUI.vue 页面
          if (~relativePath.indexOf('index.vue') || ~relativePath.indexOf('index.nvue')) {
            return util.readFile('inputTabBarFile').then((extLocalData) => {
              const packFiles = glob.sync(util.path.uniUiComponentsFiles + '/**/*.json')
              let lists = ''
              packFiles.forEach(name => {
                if (!~name.indexOf('config.json')) {
                  return
                }
                let dataLists = util.readFileSync(name)
                dataLists = JSON.parse(dataLists)
                if (dataLists.hidden) return
                if (dataLists.compilation) {
                  lists += `// ${dataLists.compilation} \n {name:"${dataLists.name} ${dataLists.desc}",url:"${dataLists.url}"},\n // #endif \n`
                } else {
                  lists += `{name:"${dataLists.name} ${dataLists.desc}",url:"${dataLists.url}"},\n`
                }
              })
              extLocalData = extLocalData.replace('/*lists*/', value => {
                return `lists: [${lists}]`
              })

              let result = beautify.html(extLocalData, {
                indent_size: 4,
                indent_with_tabs: true
              })
              // 输出文件
              return util.outputFile('outputTabBarFile', result)
            })
          }

          return syncPages({dest, util, name})
          // console.log(name)
        })
      }, Promise.resolve([])).then(() => {
        console.log('---- 同步页面完成 ----')
        resolve()
      })
    })
  })
}

/**
 * 处理页面样式
 * @param {*} param0
 */

function syncPages ({util, dest, name}) {
  return util.readFile(name).then(dataFile => {
    let result = ''
    // // 向示例里添加样式
    if (dataFile.match(/<style/ig)) {
      // 处理全局 sass ，添加 /*del*/ 方便匹配删除多余注释
      const uniCssData = util.readFileSync(util.path.uniScss).replace(/(\/\/.*$)|(\/\*(.|\s)*?\*\/)/g, (value) => {
        return ''
      }) + '/*del*/'

      // 处理 @import sass 样式到页面
      result = dataFile.replace(/<style[\s\S]*(?=<\/style>)/ig, value => {
        // 处理 @import 的情况
        value = value.replace(/@import[^;]+;/g, file => {
          file = file.match(/'@\/(.*)'/)[0].replace('@/', '').replace(/'/g, '').split('/')

          if (file.indexOf('uni.scss') !== -1) {
            return ''
          }
          return util.readFileSync(util.pathjoin('uniUiPagesFiles', '..', ...file)).toString()
        })

        // 拼接样式
        value = uniCssData + value.replace(value.match(/^[^>]*(>)/)[0], '')
        let css = null
        // 转换 sass 变量
        try {
          css = postCss(value)
        } catch (err) {
          console.error(name)
          // Message.error({
          //   content: err.message,
          //   duration: 0
          // })
          return
        }

        return '<style>' + css
      })
    } else {
      result = dataFile + '\n' + '<style></style>'
    }
    result = result.replace(/<style[\s\S]*(?:\/\*del\*\/)/ig, value => {
      return '<style>'
    })
    result = beautify.html(result, {
      indent_size: 4,
      indent_with_tabs: true
    })
    return fs.outputFile(dest, result).then(() => {
      // TODO 这里可以写一些进度什么的
      // console.log('同步到 hello uni-app 页面')
    })
  })
}

export default syncPage
