import {Modal, notification} from 'ant-design-vue'
const glob = require('glob')
const fs = require('fs-extra')
const Util = require('../lib/utils')
const ZIP = require('@/build/lib/jszip')
const crypto = require('crypto')
const request = require('request')
const exec = require('child_process').exec
const url = 'https://ext.dcloud.net.cn/publish/internal'

const syncComponents = (util, extLocalPath, key) => {
  const outUniAppPath = util.pathjoin('tempCatalog', 'uni-ui')
  // 遍历缓存目录，如果存在就删除掉
  return util.exists(util.path.tempCatalog).then((exists) => {
    return util.copy('uniUiPagesSrcFiles', outUniAppPath).then(() => {
      console.log('--- 复制文件 ---')
      const tempComPath = util.pathjoin(outUniAppPath, 'components')
      const delFileLists = glob.sync(tempComPath + '/**/*.{json,md,bak}')
      const readme = util.pathjoin('uniUiPagesSrcFiles', '..', 'readme.md')
      const tempReadme = util.pathjoin('tempCatalog', 'readme.md')
      // 删除json  md 等不必要文件
      delFileLists.forEach((fileName) => {
        fs.removeSync(fileName)
      })
      // 删除unpackage
      fs.removeSync(util.pathjoin(outUniAppPath, 'unpackage'))
      fs.copySync(readme, tempReadme)
      return syncZip({util, outUniAppPath, extLocalPath, key}).then(() => {
        console.log(key)
        // 更新到插件市场
        if (key === 1) {
          return syncExt({util}).then((res) => {
            console.log('--- 上传插件市场成功 ---', res)
            notification.success({
              message: `uni-ui 整包上传插件市场成功`,
              description: res.desc
            })
          }).catch((err) => {
            console.log('--- 上传插件市场失败 ---', err)
            notification.error({
              message: `uni-ui 整包上传插件市场失败`,
              description: err.desc
            })
          })
        }
        if (key === 2) {
          console.log('---- 准备更新到 NPM ----')
          return startNpm({util}).then(() => {
            util.exists('tempCatalog')
          })
        }
        if (key === 3) {
          return syncExt({util}).then((res) => {
            console.log('--- 上传插件市场成功 ---', res)
            notification.success({
              message: `uni-ui 整包上传插件市场成功，开始更新 NPM`,
              description: res.desc
            })
            return startNpm({util}).then(() => {
              util.exists('tempCatalog')
            })
          }).catch((err) => {
            console.log('--- 上传插件市场失败 ---', err)
            notification.error({
              message: `uni-ui 整包上传插件市场失败,停止更新 NPM`,
              description: err.desc
            })
          })
        }
      })
    })
  })
}

/**
 * 生成zip 包
 */
function syncZip ({util, outUniAppPath, extLocalPath, key}) {
  // 输出 components zip 包
  return ZIP(outUniAppPath, util.path.tempCatalog, 'uni-ui').then(() => {
    console.log('zip打包成功')
    // 如果是0 ，那就值生成插件包到本地
    if (key === 0) {
      const localComPath = util.pathjoin(extLocalPath, 'uni-ui')
      // 生成本地插件包
      fs.copySync(util.path.tempCatalog, localComPath)
      const uniuiDir = fs.readdirSync(localComPath)
      uniuiDir.forEach((name) => {
        if (name.indexOf('.md') === -1 && name.indexOf('.zip') === -1) {
          fs.removeSync(util.pathjoin(localComPath, name))
        }
      })
      return util.exists('tempCatalog').then(() => {
        console.log('删除 temp 临时目录')
        notification.success({
          message: '成功反馈',
          description: `uni-ui 生成本地插件包成功`
        })
      })
    }
  })
}

/**
 * 上传插件市场
 */
function syncExt ({util}) {
  // 上传插件市场
  console.log('上传插件市场')
  const packageUniui = util.pathjoin('uniUiPagesSrcFiles', '..', 'package.json')
  const packageJson = JSON.parse(util.readFileSync(packageUniui, 'utf8'))
  const t = new Date().getTime() // 获取时间戳
  const pluginPackage = util.pathjoin('tempCatalog', 'uni-ui.zip') // 组件包
  const pluginExample = util.pathjoin('tempCatalog', `uni-ui.zip`) // 示例包
  const pluginMd = util.pathjoin('tempCatalog', 'readme.md')// readme.md
  let sign = `id=${packageJson.id}&t=${t}&version=${packageJson.version}&key=mUfEvHMR3p9BPwnl` // 获取 sign 签名
  sign = crypto.createHash('md5').update(sign).digest('hex')
  const formData = {
    id: packageJson.id,
    version: packageJson.version,
    t: t,
    sign: sign,
    plugin_package: fs.createReadStream(pluginPackage),
    plugin_example: fs.createReadStream(pluginExample),
    plugin_md: fs.createReadStream(pluginMd),
    update_log: packageJson.description
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
 * 更新到 npm
 * @param {*} param0
 */
function startNpm ({util}) {
  // 任何你期望执行的cmd命令，ls都可以
  let cmdStr1 = 'npm run build:npm'
  let cmdPath = util.pathjoin('uniUiPagesSrcFiles', '../')
  // 子进程名称
  console.log(cmdPath)
  return runExec(cmdStr1, cmdPath)
}

function runExec (cmdStr, cmdPath) {
  return new Promise((resolve, reject) => {
    let workerProcess

    workerProcess = exec(cmdStr, { cwd: cmdPath })
    // 打印正常的后台可执行程序输出
    workerProcess.stdout.on('data', function (data) {
      const code = data.indexOf('ERR! 403')
      if (code !== -1) {
        notification.error({
          message: 'npm 更新失败',
          description: data
        })
        resolve(data)
      // console.log(data)
      }
      const successCode = data.indexOf('+ @mehaotian/uni-ui')
      if (successCode !== -1) {
      // console.log(data)
        notification.success({
          message: 'npm 更新成功',
          description: data
        })
        resolve(data)
      }
    })
    // 打印错误的后台可执行程序输出
    workerProcess.stderr.on('data', function (data) {
      console.error(data)
    })
    // 退出之后的输出
    workerProcess.on('close', function (code) {
      console.log(code)
      if (code === 0) {
        console.log('npm 发布成功，错误码为：' + code)
      } else {
        console.error('npm 发布错误，错误码为：' + code)
        reject(code)
      }
    })
  })
}

const syncUniUi = (uniuiPath, extLocalPath, event) => {
  return new Promise((resolve, reject) => {
    const {key} = event
    const util = Util.getInstance()
    util.init(uniuiPath)
    let strInfo = ''
    let strName = ''
    switch (key) {
      case 0 :
        console.log('--- 更新插件包 ---')
        strInfo = '是否生成 uni-ui 插件包到本地'
        strName = '开始生成 uni-ui 到本地...'
        break
      case 1 :
        console.log('--- 更新插件市场 ---')
        strInfo = '是否将 uni-ui 整包更新到插件市场'
        strName = '开始更新 uni-ui 到插件市场...'
        break
      case 2 :
        strInfo = '是否更新 uni-ui 到 NPM'
        console.log('--- 更新 npm ---')
        strName = '开始更新 uni-ui 到 NPM'

        break
      case 3 :
        strInfo = '是否更新 uni-ui 到 NPM 并上传插件市场'
        strName = '开始更新 uni-ui 到 NPM 并开始上传到插件市场'

        console.log('--- 更新插件市场&npm ---')
        break
    }

    let modal = Modal.confirm({
      title: '提示',
      content: strInfo,
      loading: true,
      onOk: () => {
        notification.info({
          message: '提示',
          description: strName
        })
        // 销毁弹窗
        modal.destroy()
        syncComponents(util, extLocalPath, key).then(() => {
          console.log('------- success')
          resolve()
        }).catch((err) => {
          console.log('------- error')
          reject(err)
        })
      },
      onCancel: (err) => {
        modal.destroy()
        reject(err)
      }
    })
  })
}

export default syncUniUi
