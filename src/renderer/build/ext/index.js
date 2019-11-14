const glob = require('glob')
const path = require('path')
// const qs = require('qs')
const fs = require('fs-extra')
const Util = require('./lib/utils')
const postCss = require('@/build/lib/postcss')
const ZIP = require('@/build/lib/jszip')
const beautify = require('js-beautify')
const crypto = require('crypto')
const request = require('request')
// var FormData = require('form-data')

const syncComponents = (util, extLocalPath, options) => {
  let vueFiles = glob.sync(util.path.uniUiComponentsFiles + '/**/*.json')
  let filesData = []
  vueFiles.forEach(name => {
    const fileName = path.relative(util.path.uniUiComponentsFiles, name)
    if (!~fileName.indexOf('config')) {
      return
    }
    filesData.push(JSON.parse(util.readFileSync(name, 'utf8')))
  })
  const filesIndex = filesData.findIndex((value) => value.id === options.id)
  const outUniAppPath = util.pathjoin('tempCatalog', `uni-${filesData[filesIndex].url}`)
  const inputIndexPages = util.pathjoin('uniUiPagesFiles', filesData[filesIndex].url)
  const outIndexPages = util.pathjoin(outUniAppPath, 'pages', filesData[filesIndex].url)
  // 0. 如果存在临时目录，那么就删除重新创建
  util.exists(util.path.tempCatalog).then((exists) => {
    console.log('删除目录重新创建')
    console.log(outUniAppPath)

    // 1. 将示例工程拷贝到临时目录，等待处理
    util.copy('exampleCatalog', outUniAppPath).then(() => {
      // 2. 处理组件示例入口 index.vue 文件
      fs.copySync(inputIndexPages, outIndexPages)
      let pagesIndexData = glob.sync(outIndexPages + '/**/*.{nvue,vue}')
      pagesIndexData.forEach((item) => {
        const dataFile = util.readFileSync(item)
        // 处理示例页面 css ，将全局样式插入其中
        _HandlePages(util, dataFile, item, filesData[filesIndex].url)
        // 抽离组件到对应文件夹
        _HandleComponents(util, dataFile, filesData[filesIndex].url)
      })
      // 3. 处理组件示例的 pages.json
      fs.outputFileSync(util.pathjoin(outUniAppPath, 'pages.json'), JSON.stringify({
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
      }, '', 2))
      // 3. 将用到的组件拷贝到目录
      util.readdir('uniUiComponentsFiles').then((fileList) => {
        fileList.forEach((name) => {
          if (!~name.indexOf('uni-')) {
            return
          }
          const outName = `uni-${filesData[filesIndex].url}`
          if (~name.indexOf(outName)) {
            const uniuiPath = util.pathjoin('uniUiComponentsFiles', name)
            const tempComPath = util.pathjoin('tempCatalog', 'components', 'components')
            const tempPath = util.pathjoin('tempCatalog', 'components', 'components', name)
            const readme = util.pathjoin('uniUiComponentsFiles', name, 'readme.md')
            const tempReadme = util.pathjoin('tempCatalog', 'readme.md')
            fs.copySync(uniuiPath, tempPath)
            // util.vue.$Message.success({
            //   content: '组件同步成功'
            // })
            _screenComponents(util, tempPath, tempComPath)
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
            // 5. 生成zip 包
            const inputZipComPath = util.pathjoin('tempCatalog', 'components')
            const inputZipPagePath = util.pathjoin('tempCatalog', outName)
            const outZipPath = util.path.tempCatalog
            console.log(inputZipComPath, outZipPath)
            // 输出 components zip 包
            ZIP(inputZipComPath, outZipPath, 'components').then(() => {
              console.log(inputZipPagePath, outZipPath, outName)
              ZIP(inputZipPagePath, outZipPath, outName).then(() => {
                console.log('生成 zip 成功')
                // 生成本地插件包，存放到本地
                if (options.generate) {
                  console.log(extLocalPath)
                  const localComPath = util.pathjoin(extLocalPath, outName)
                  fs.copySync(outZipPath, localComPath)
                  // util.copy(outZipPath, localComPath).then((topath) => {
                  const uniuiDir = fs.readdirSync(localComPath)
                  // console.log(uniuiDir)
                  uniuiDir.forEach((name) => {
                    if (name.indexOf('.md') === -1 && name.indexOf('.zip') === -1) {
                      fs.removeSync(util.pathjoin(localComPath, name))
                    }
                  })
                  // })
                  return
                }
                // 上传插件市场
                console.log('上传插件市场')
                const t = new Date().getTime() // 获取时间戳
                const pluginPackage = util.pathjoin('tempCatalog', 'components.zip') // 组件包
                const pluginExample = util.pathjoin('tempCatalog', `/uni-${options.url}.zip`) // 示例包
                const pluginMd = util.pathjoin('tempCatalog', 'readme.md')// readme.md
                let sign = `id=${options.id}&t=${t}&version=${options.edition}&key=mUfEvHMR3p9BPwnl` // 获取 sign 签名
                sign = crypto.createHash('md5').update(sign).digest('hex')
                const url = 'https://ext.dcloud.net.cn/publish/internal'

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
                util.vue.$Modal.confirm({
                  title: '提示',
                  content: '是否上传插件市场？',
                  loading: true,
                  onOk: () => {
                    request.post({url: url, formData: formData}, function (err, httpResponse, body) {
                      util.vue.$Modal.remove()
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
                      console.log(res)
                      console.log(httpResponse)
                      if (res.ret === 0) {
                        util.vue.$Notice.success({
                          title: '提示',
                          desc: res.desc
                        })
                      } else {
                        util.vue.$Notice.error({
                          title: '提示',
                          desc: res.desc
                        })
                      }
                      console.log(res)
                    })
                  }
                })
              })
            })
          }
        })
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
        util.vue.$Message.error({
          content: err.message,
          duration: 0
        })
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
      console.log(inputFilesPath, outFilesPath)
      console.log('开始拷贝js：' + filePath)
      fs.copySync(inputFilesPath, outFilesPath)
      console.log('拷贝js成功')
    })
  }
  fs.outputFileSync(item, result)
  // util.vue.$Message.success({
  //   content: '首页同步成功'
  // })
}

/**
 * 处理文件内组件
 * @param {*} util
 * @param {*} dataFile
 */
const _HandleComponents = (util, dataFile, comName) => {
  const newUniNameArray = util.uniq(_getComName(dataFile))
  newUniNameArray.forEach((name) => {
    const uniuiPath = util.pathjoin('uniUiComponentsFiles', name)
    const tempComPath = util.pathjoin('tempCatalog', `uni-${comName}`, 'components')
    const tempPath = util.pathjoin('tempCatalog', `uni-${comName}`, 'components', name)

    fs.copySync(uniuiPath, tempPath)
    _screenComponents(util, tempPath, tempComPath)
    // 删除多余无用文件
    const delFileLists = glob.sync(tempComPath + '/**/*.{json,md,bak}')
    delFileLists.forEach((fileName) => {
      fs.removeSync(fileName)
    })
  })
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
  fileList.forEach((name) => {
    if (name.indexOf('.vue') !== -1) {
      const filesContent = util.readFileSync(util.pathjoin(fileName, name))
      const list = util.uniq(_getComName(filesContent))
      if (list.length > 0) {
        console.log(name + '组件检测到组件内关联组件子组件：' + list)
      } else {
        console.log(name + '组件同步完成')
      }
      list.forEach((subName) => {
        const uniuiPath = util.pathjoin('uniUiComponentsFiles', subName)
        const tempPath = util.pathjoin(tempComPath, subName)
        const exists = fs.existsSync(tempPath)
        const uniAppExists = fs.existsSync(uniuiPath)
        if (!exists && uniAppExists) {
          fs.copySync(uniuiPath, tempPath)
          _screenComponents(util, tempPath, tempComPath)
        }
      })
    }
  })
}

const syncUniUi = (uniuiPath, extLocalPath, options, vue) => {
  const util = Util.getInstance()
  util.init(uniuiPath, vue)
  syncComponents(util, extLocalPath, options)
  // util.vue.$Message.loading({
  //   content: '开始生成组件示例'
  // })
  // 同步组件
}

module.exports = syncUniUi
