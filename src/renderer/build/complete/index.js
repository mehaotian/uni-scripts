/* eslint-disable vue/no-parsing-error */
import {Modal, Notice} from 'iview'
const glob = require('glob')
const fs = require('fs-extra')
const Util = require('../lib/utils')
const ZIP = require('@/build/lib/jszip')
const crypto = require('crypto')
const request = require('request')
const exec = require('child_process').exec

const syncComponents = (util, extLocalPath, generate) => {
  const outUniAppPath = util.pathjoin('tempCatalog', 'uni-ui')
  // 0. 如果存在临时目录，那么就删除重新创建
  util.exists(util.path.tempCatalog).then((exists) => {
    console.log('删除目录重新创建')
    // 1. 将示例工程拷贝到临时目录，等待处理
    util.copy('uniUiPagesSrcFiles', outUniAppPath).then(() => {
      // 2. 处理组件示例入口 index.vue 文件
      console.log('success')
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

      ZIP(outUniAppPath, util.path.tempCatalog, 'uni-ui').then(() => {
        console.log('zip打包成功')
        const localComPath = util.pathjoin(extLocalPath, 'uni-ui')
        // 生成本地插件包
        if (generate) {
          fs.copySync(util.path.tempCatalog, localComPath)
          const uniuiDir = fs.readdirSync(localComPath)
          uniuiDir.forEach((name) => {
            if (name.indexOf('.md') === -1 && name.indexOf('.zip') === -1) {
              fs.removeSync(util.pathjoin(localComPath, name))
            }
          })
          console.log('本地插件包生成成功')
          Modal.remove()
          Notice.success({
            title: '提示',
            desc: '生成本地插件包成功'
          })
          return
        }
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
        const url = 'https://ext.dcloud.net.cn/publish/internal'

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

        request.post({url: url, formData: formData}, function (err, httpResponse, body) {
          Modal.remove()
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
          if (httpResponse.statusCode === 200) {
            if (res.ret === 0) {
              Notice.success({
                title: '提示',
                desc: res.desc
              })
            } else {
              Notice.error({
                title: '提示',
                desc: res.desc
              })
            }
          } else {
            Notice.error({
              title: '提示',
              desc: httpResponse.statusMessage
            })
          }
        })
      })
    })
  })
}
function start (uniuiPath, fn) {
  // 任何你期望执行的cmd命令，ls都可以
  let cmdStr1 = 'npm run build:lib'
  let cmdPath = uniuiPath
  // 子进程名称
  let workerProcess
  runExec(cmdStr1)
  function runExec (cmdStr) {
    workerProcess = exec(cmdStr, { cwd: cmdPath })
    // 打印正常的后台可执行程序输出
    workerProcess.stdout.on('data', function (data) {
      // console.log(data)
      if (data !== '0') {
        Notice.error({
          title: '提示',
          desc: 'npm 发布错误，错误码：' + data
        })
        Modal.remove()
        console.error('npm 发布错误，错误码为：' + data)
      } else {
        if (!fn) {
          Notice.success({
            title: '提示',
            desc: 'npm success'
          })
        } else {
          fn()
        }
        console.log(data)
      }
    })
    // 打印错误的后台可执行程序输出
    workerProcess.stderr.on('data', function (data) {
      console.log('stderr: ' + data)
    })
    // 退出之后的输出
    workerProcess.on('close', function (code) {
      console.log(code)
      if (code === 0) {
        Notice.success({
          title: '提示',
          desc: 'npm success'
        })
      } else {
        Modal.remove()
        Notice.error({
          title: '提示',
          desc: 'npm 发布错误，错误码为：' + code
        })
        console.error('npm 发布错误，错误码为：' + code)
      }
    })
  }
}

const syncUniUi = (uniuiPath, extLocalPath, generate, event) => {
  const util = Util.getInstance()
  util.init(uniuiPath)
  if (generate) {
    Modal.confirm({
      title: '提示',
      content: '是否生成本地插件包',
      loading: true,
      onOk: () => {
        syncComponents(util, extLocalPath, generate)
      }
    })
  } else {
    console.log(event)
    if (event === 0) {
      Modal.confirm({
        title: '提示',
        content: '是否上传插件市场？',
        loading: true,
        onOk: () => {
          syncComponents(util, extLocalPath, generate)
        }
      })
    } else if (event === 1) {
      Modal.confirm({
        title: '提示',
        content: '是否更新到 npm？',
        loading: true,
        onOk: () => {
          start(uniuiPath)
        }
      })
    } else if (event === 2) {
      Modal.confirm({
        title: '提示',
        content: '是否同时上传插件市场和 npm？',
        loading: true,
        onOk: () => {
          start(uniuiPath, () => {
            syncComponents(util, extLocalPath, generate)
          })
        }
      })
    }
  }
}

export default syncUniUi
