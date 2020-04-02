import { Modal, notification } from 'ant-design-vue'

const glob = require('glob')
const path = require('path')
const fs = require('fs-extra')
const Util = require('../lib/utils')
const postCss = require('@/build/lib/postcss')
const ZIP = require('@/build/lib/jszip')
const beautify = require('js-beautify')
const crypto = require('crypto')
const request = require('request')
const url = 'https://ext.dcloud.net.cn/publish/internal'

const syncComponents = (util, extLocalPath, options) => {
  console.log(_HandlePages)
  console.log(_HandleComponents)
  let vueFiles = glob.sync(util.path.uniUiComponentsFiles + '/**/*.json')
  let filesData = []
  // 处理所有组件信息
  vueFiles.forEach(name => {
    const fileName = path.relative(util.path.uniUiComponentsFiles, name)
    if (!~fileName.indexOf('config')) {
      return
    }
    filesData.push(JSON.parse(util.readFileSync(name, 'utf8')))
  })
  // 获取点击组件的索引
  const filesIndex = filesData.findIndex((value) => {
    return value.id === options.id
  })

  const outUniAppPath = util.pathjoin('tempCatalog', `uni-${filesData[filesIndex].url}`)
  const inputIndexPages = util.pathjoin('uniUiPagesFiles', 'vue', filesData[filesIndex].url)
  const outIndexPages = util.pathjoin(outUniAppPath, 'pages', filesData[filesIndex].url)
  console.log(outIndexPages)
  console.log(filesIndex)
  // 遍历当前 临时目录里的所有组件
  return util.exists(util.path.tempCatalog).then((exists) => {
    console.log(exists)
    // // 1. 将示例工程拷贝到临时目录，等待处理 ，生成基础 组件示例框架
    return util.copy('exampleCatalog', outUniAppPath).then(() => {
      // 2. 处理组件示例入口 index.vue 文件
      fs.copySync(inputIndexPages, outIndexPages)
      let pagesIndexData = glob.sync(outIndexPages + '/**/*.{nvue,vue}')
      console.log(pagesIndexData)
      return pagesIndexData.reduce((promise, item) => {
        return promise.then(() => {
          const dataFile = util.readFileSync(item)
          // 处理示例页面 css ，将全局样式插入其中
          return _HandlePages(util, dataFile, item, filesData[filesIndex].url).then(() => {
            // 抽离组件到对应文件夹
            return _HandleComponents(util, dataFile, filesData[filesIndex].url)
          })
        })
      }, Promise.resolve([])).then(() => {
        const pageJson = JSON.stringify({
          'pages': [
            {
              'path': `pages/${filesData[filesIndex].url}/${filesData[filesIndex].url}`,
              'style': {
                'navigationBarTitleText': 'uni-app'
              }
            }
          ],
          'globalStyle': {
            'navigationBarTextStyle': 'black',
            'navigationBarTitleText': 'uni-app',
            'navigationBarBackgroundColor': '#F8F8F8',
            'backgroundColor': '#F8F8F8'
          }
        }, '', 2)
        // 同步 json 文件
        fs.outputFileSync(util.pathjoin(outUniAppPath, 'pages.json'), pageJson)
        // 3. 将用到的组件拷贝到目录
        return util.readdir('uniUiComponentsFiles').then((fileList) => {
          fileList.reduce((promise, name) => {
            return promise.then((res) => {
              if (!~name.indexOf('uni-')) {
                return
              }
              const outName = `uni-${filesData[filesIndex].url}`
              if (~name.indexOf(outName)) {
                const uniuiPath = util.pathjoin('uniUiComponentsFiles', name)
                const tempPath = util.pathjoin('tempCatalog', 'components', 'components', name)
                const tempComPath = util.pathjoin('tempCatalog', 'components', 'components')
                const readme = util.pathjoin('uniUiComponentsFiles', name, 'readme.md')
                const tempReadme = util.pathjoin('tempCatalog', 'readme.md')
                const scss = util.pathjoin('uniUiPagesSrcFiles', 'uni.scss')
                const tempScss = util.pathjoin('tempCatalog', name, 'uni.scss')
                fs.copySync(uniuiPath, tempPath)
                return _screenComponents(util, tempPath, tempComPath).then(() => {
                  // 删除多余无用文件
                  const delFileLists = glob.sync(tempComPath + '/**/*.{json,md,bak}')
                  delFileLists.forEach((fileName) => {
                    fs.removeSync(fileName)
                  })
                  // 4. 同步 readme.md
                  const exists = fs.existsSync(readme)
                  if (exists) {
                    fs.copySync(readme, tempReadme)
                  }
                  // 5. 同步 uni.scss
                  const existsscss = fs.existsSync(scss)
                  if (existsscss) {
                    fs.copySync(scss, tempScss)
                  }
                  return name
                })
              }
              return res
            })
          }, Promise.resolve([])).then((name) => {
            // 5. 生成zip 包
            return syncZip({util, filesData, filesIndex, options, extLocalPath, name}).then(() => {
              console.log('---- 生成本地 zip 包成功 ----')
              if (!options.generate) {
                return syncExt({util, options}).then((res) => {
                  console.log('--- 上传插件市场成功 ---', res)
                  notification.success({
                    message: `${name} 组件上传插件市场成功`,
                    description: res.desc
                  })
                }).catch((err) => {
                  console.log('--- 上传插件市场失败 ---', err)
                  notification.error({
                    message: `${name} 组件上传插件市场失败`,
                    description: err.desc
                  })
                })
              }
            })
          })
        })
      })
    })
  })
}
/**
 * 生成zip 包
 */
function syncZip ({util, filesData, filesIndex, options, extLocalPath, name}) {
  let outFileName = `uni-${filesData[filesIndex].url}`
  const inputZipComPath = util.pathjoin('tempCatalog', 'components')
  const inputZipPagePath = util.pathjoin('tempCatalog', outFileName)
  const outZipPath = util.path.tempCatalog
  console.log(inputZipComPath, outZipPath)
  // 输出 components zip 包
  return ZIP(inputZipComPath, outZipPath, 'components').then(() => {
    console.log(inputZipPagePath, outZipPath, outFileName)
    return ZIP(inputZipPagePath, outZipPath, outFileName).then(() => {
      console.log('生成 zip 成功')
      // 生成本地插件包，存放到本地
      if (options.generate) {
        console.log(extLocalPath)
        const localComPath = util.pathjoin(extLocalPath, outFileName)
        fs.copySync(outZipPath, localComPath)
        const uniuiDir = fs.readdirSync(localComPath)
        // 删除其他目录
        uniuiDir.forEach((name) => {
          if (name.indexOf('.md') === -1 && name.indexOf('.zip') === -1) {
            fs.removeSync(util.pathjoin(localComPath, name))
          }
        })
        return util.exists('tempCatalog').then(() => {
          console.log('删除 temp 临时目录')
          notification.success({
            message: '成功反馈',
            description: `${name} 组件生成本地插件包成功`
          })
        })
      }
    })
  })
}

/**
 * 上传插件市场
 */
function syncExt ({util, options}) {
  console.log('上传插件市场')
  const t = new Date().getTime() // 获取时间戳
  const pluginPackage = util.pathjoin('tempCatalog', 'components.zip') // 组件包
  const pluginExample = util.pathjoin('tempCatalog', `/uni-${options.url}.zip`) // 示例包
  const pluginMd = util.pathjoin('tempCatalog', 'readme.md')// readme.md
  let sign = `id=${options.id}&t=${t}&version=${options.edition}&key=mUfEvHMR3p9BPwnl` // 获取 sign 签名
  sign = crypto.createHash('md5').update(sign).digest('hex')

  const formData = {
    id: options.id,
    version: options.edition,
    t: t,
    sign: sign,
    plugin_package: fs.createReadStream(pluginPackage),
    plugin_example: fs.createReadStream(pluginExample),
    plugin_md: fs.createReadStream(pluginMd),
    update_log: options.update_log
  }
  return requestExt({util, formData})
}

/**
 * 请求函数封装
 */

function requestExt ({util, formData}) {
  return new Promise((resolve, reject) => {
    request.post({url: url, formData: formData}, (err, httpResponse, body) => {
      if (err) {
        return console.error('upload failed:', err)
      }
      let res = null
      try {
        res = JSON.parse(body)
      } catch (error) {
        console.log(error)
        res = {
          ret: 201,
          desc: '提交失败，请刷新重试'
        }
      }
      return util.exists('tempCatalog').then(() => {
        console.log('删除 temp 临时目录')
        if (res.ret === 0) {
          console.log(res)
          resolve(res)
        } else {
          reject(res)
        }
      })
    })
  })
}

/**
 * 处理文件 css
 * @param {*} util
 * @param {*} dataFile
 * @param {*} item
 */
const _HandlePages = (util, dataFile, item, name) => {
  return new Promise((resolve) => {
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
    // 同步页面内引入外部js 到对应位置
    const importFiles = result.match(/import.*from\s'.*'/ig)
    if (importFiles) {
      importFiles.forEach(value => {
        let filePath = value.match(/import.*from\s'.*'/)[0].split('\'')[1]
        filePath = filePath.replace('@', '')
        if (path.extname(filePath) === '') {
          filePath += '.js'
        }
        if (path.extname(filePath) !== '.js') {
          return
        }
        const inputFilesPath = util.pathjoin('uniUiPagesFiles', '..', ...filePath.split('/'))
        const outFilesPath = util.pathjoin('tempCatalog', `uni-${name}`, ...filePath.split('/'))
        fs.copySync(inputFilesPath, outFilesPath)
      })
    }
    fs.outputFile(item, result).then(() => {
      resolve()
    })
  })
}

/**
 * 处理文件内组件
 * @param {*} util
 * @param {*} dataFile
 */
const _HandleComponents = (util, dataFile, comName) => {
  const newUniNameArray = util.uniq(_getComName(dataFile))
  return newUniNameArray.reduce((promise, name) => {
    return promise.then(() => {
      const uniuiPath = util.pathjoin('uniUiComponentsFiles', name)
      const tempComPath = util.pathjoin('tempCatalog', `uni-${comName}`, 'components')
      const tempPath = util.pathjoin('tempCatalog', `uni-${comName}`, 'components', name)

      fs.copySync(uniuiPath, tempPath)
      return _screenComponents(util, tempPath, tempComPath).then(() => {
        // 删除多余无用文件
        const delFileLists = glob.sync(tempComPath + '/**/*.{json,md,bak}')
        delFileLists.forEach((fileName) => {
          console.log('----- 删除多余文件', fileName)
          fs.removeSync(fileName)
        })
      })
    })
  }, Promise.resolve([]))
}

/**
 * 获取依赖组件信息
 * @param {*} dataFile
 */
const _getComName = (dataFile) => {
  let uniNameArray = dataFile.match(/<uni-\S+?(?=\s|\/?>)/ig)
  let newUniNameArray = []
  if (!uniNameArray) return []
  uniNameArray.forEach(value => {
    value = value.replace(/>|</ig, '')
    if (!~newUniNameArray.indexOf(value)) {
      newUniNameArray.push(value)
    }
  })
  return newUniNameArray
}

/**
 * 深层拷贝组件
 * @param {*} fileName
 */
const _screenComponents = (util, fileName, tempComPath) => {
  const fileList = fs.readdirSync(fileName)
  return fileList.reduce((promise, name) => {
    return promise.then(() => {
      if (name.indexOf('.vue') !== -1) {
        const filesContent = util.readFileSync(util.pathjoin(fileName, name))
        const list = util.uniq(_getComName(filesContent))
        if (list.length > 0) {
          console.log(name + '组件检测到组件内关联组件子组件：' + list)
        } else {
          console.log(name + '组件同步完成')
        }
        return list.reduce((pms, subName) => {
          return pms.then(() => {
            const uniuiPath = util.pathjoin('uniUiComponentsFiles', subName)
            const tempPath = util.pathjoin(tempComPath, subName)
            const exists = fs.existsSync(tempPath)
            const uniAppExists = fs.existsSync(uniuiPath)
            if (!exists && uniAppExists) {
              fs.copySync(uniuiPath, tempPath)
              return _screenComponents(util, tempPath, tempComPath)
            }
          })
        }, Promise.resolve([]))
      }
    })
  }, Promise.resolve([]))
}

const syncUniUi = (uniuiPath, extLocalPath, options) => {
  const util = Util.getInstance()
  util.init(uniuiPath)
  // Modal.confirm({
  //   title: '提示',
  //   content: options.generate ? '是否生成本地插件包' : '是否上传插件市场？',
  //   loading: true,
  //   onOk: () => {

  //   }
  // })
  let modal = Modal.confirm({
    title: '提示',
    content: options.generate ? '是否生成本地插件包' : '是否上传插件市场？',
    loading: true,
    onOk: () => {
      notification.info({
        message: '提示',
        description: options.generate ? '开始生成本地插件包' : '开始上传插件市场？'
      })
      // 销毁弹窗
      modal.destroy()
      syncComponents(util, extLocalPath, options)
    }
  })
}

export default syncUniUi
