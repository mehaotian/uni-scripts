// import {Message} from 'iview'
const beautify = require('js-beautify')
const postCss = require('@/build/lib/postcss')
const fs = require('fs-extra')

const syncUniUiComponents = (util, fn) => {
  return new Promise((resolve) => {
    // 1. 同步静态文件
    util.copy('uniUiStaticFile', 'outputStaticFile').then(() => {
      console.log('---- 同步静态文件完成 ----')
    })

    // 读取所有文件
    util.readdir('uniUiComponentsFiles').then((fileLists) => {
      // 循环文件列表
      fileLists.reduce((promise, item) => {
        return promise.then(() => {
          if (!~item.indexOf('uni-')) {
            return
          }

          // 处理全局 sass 文件
          const uniCssData = util.readFileSync(util.path.uniScss).replace(/(\/\/.*$)|(\/\*(.|\s)*?\*\/)/g, (value) => {
            return ''
          }) + '/*del*/'

          const relativePath = util.pathjoin(util.path.uniUiComponentsFiles, item)
          const topath = util.pathjoin(util.path.tempCatalog, item)
          // 拷贝组件到临时目录
          fs.copySync(relativePath, topath)
          // 删除组件内无用文件， 将 Promise 传给另一个流水线
          return util.delFiles(topath, ['.json', '.md', '.bak']).then((syncfileList) => {
            return util.readdir(topath).then((syncfileList) => {
              // 处理文件样式
              return handleStyle({syncfileList, util, topath, uniCssData})
            })
          })
        })
      }, Promise.resolve([])).then(() => {
        // 遍历缓存目录，准备同步到 uni-app
        util.readdir('tempCatalog').then((files) => {
          files.reduce((promise, data) => {
            return promise.then(() => {
              const tempPath = util.pathjoin('tempCatalog', data)
              const uniappPath = util.pathjoin('uniAppComponentsFiles', data)
              // console.log(uniappPath)
              // 删除 uni-app 组件目录
              return util.exists(uniappPath).then(() => {
                // 把缓存对应目录拷贝到 hello uni-app 中
                return util.copy(tempPath, uniappPath).then(() => {
                  // console.log('-----拷贝组件 到：', uniappPath)
                  // TODO 这里做日志记录 或者是进度条
                })
              })
            })
          }, Promise.resolve([])).then(() => {
            // 同步完成之后，删除缓存目录
            util.exists('tempCatalog').then(() => {
              console.log('---- 同步组件完成 ----')

              // console.log('删除缓存目录成功')
              // 删除后表示成功
              resolve()
            })
          })
        })
      })
    })
  })
}

/**
 * 处理文件的样式问题
 */
function handleStyle ({syncfileList, util, topath, uniCssData}) {
  return syncfileList.reduce((promise, data) => {
    return promise.then(() => {
      const fileName = util.pathjoin(topath, data)
      if (fileName.indexOf('.vue') !== -1 || fileName.indexOf('.nvue') !== -1) {
        // const dataFils = util.readFileSync(fileName)
        const dataFils = util.readFileSync(fileName)
        // util.readFile(fileName).then((dataFils) => {
        // 处理 css
        let result = dataFils.replace(/<style[\s\S]*(?=<\/style>)/ig, value => {
          value = value.replace(/@import[^;]+;/g, file => {
            return ''
          })
          // 匹配第一个 > 并替换成普通 <style>
          value = uniCssData + value.replace(value.match(/^[^>]*(>)/)[0], '')
          // 处理 sass 为 css
          let css = null
          try {
            css = postCss(value)
          } catch (err) {
            // Message.error({
            //   content: err.message,
            //   duration: 0
            // })
            return
          }
          return '<style scoped>' + css
        })
        let regNotes = /<style[\s\S]*(?:\/\*del\*\/)/ig
        let matchNotes = result.match(regNotes)
        result = result.replace(matchNotes[0], value => {
          return '<style scoped>'
        })

        // 美化代码
        result = beautify.html(result, {
          indent_size: 4,
          indent_with_tabs: true
        })
        return util.outputFile(fileName, result).then(() => {
          // console.log('完成转换，输出文件到指定目录')
        })
      }
    })
  }, Promise.resolve([]))
}

export default syncUniUiComponents
