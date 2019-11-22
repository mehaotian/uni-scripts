import {Message} from 'iview'
const beautify = require('js-beautify')
const postCss = require('@/build/lib/postcss')
const fs = require('fs-extra')

const syncUniUiComponents = (util, fn) => {
  return new Promise((resolve) => {
  // 1. 同步静态文件
    util.copy('uniUiStaticFile', 'outputStaticFile').then(() => {
      console.log('同步静态文件成功')
    })

    // 2. 复制组件到临时目录
    util.readdir('uniUiComponentsFiles').then((fileLists) => {
      let copyLen = []
      let copyCount = 0
      fileLists.forEach(function (item) {
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
        // util.copy(relativePath, tempFile).then((topath, formpath) => {
        // console.log('组件同步到临时目录，等待处理')
        // 删除组件内无用文件
        util.delFiles(topath, ['.json', '.md', '.bak']).then(() => {
        // 遍历临时目录内组件目录
          util.readdir(topath).then((syncfileList) => {
          // 获取到全部文件详细路径
            syncfileList.forEach((data) => {
              const fileName = util.pathjoin(topath, data)
              if (fileName.indexOf('.vue') !== -1 || fileName.indexOf('.nvue') !== -1) {
                copyLen.push(data)
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
                    Message.error({
                      content: err.message,
                      duration: 0
                    })
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
                util.outputFile(fileName, result).then(() => {
                  copyCount++
                  if (copyLen.length === copyCount) {
                    console.log('同步成功')
                    util.readdir('tempCatalog').then((files) => {
                      const filesLng = files.length
                      let filesCount = 0
                      files.forEach((data) => {
                        const tempPath = util.pathjoin('tempCatalog', data)
                        const uniappPath = util.pathjoin('uniAppComponentsFiles', data)
                        // console.log('目录是否存在', fs.existsSync(uniappPath))
                        // fs.copySync(tempPath, uniappPath)
                        util.copy(tempPath, uniappPath).then(() => {
                          filesCount++
                          if (filesLng === filesCount) {
                            console.log('全部组件同步完成')

                            resolve()
                          }
                        })
                      })
                    })
                  }
                })
              // })
              }
            })
          })
        })
      // })
      })
    })
  })
}

export default syncUniUiComponents
