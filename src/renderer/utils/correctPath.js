const path = require('path')
const fs = require('fs-extra')

function correct (url, types) {
  const exists = fs.existsSync(url)
  console.log(exists)
  if (!exists) {
    return {
      msg: types + '路径不存在',
      isUrl: false
    }
  }
  let inputFile = null
  // let condition = '@dcloudio/uni-ui'
  switch (types) {
    case 'uniui':
      inputFile = path.join(url, './package.json')
      // condition = '@dcloudio/uni-ui'
      break
    case 'uniapp':
      inputFile = path.join(url, './manifest.json')
      // condition = 'hello uni-app'
      break
    case 'appstore':
      inputFile = path.join(url, './manifest.json')
      // condition = 'hello uni-app'
      break
    case 'docs':
      inputFile = path.join(url, './component/_sidebar.md')
      // condition = 'docs-uniapp'
      break
    default:
      break
  }
  let isOk = null
  // let data = ''
  console.log(inputFile)
  try {
    // data = fs.readFileSync(inputFile, 'utf8')
    isOk = true
  } catch (e) {
    // TODO handle the exception
    console.log('error')
    isOk = false
  }
  if (isOk) {
    return {
      msg: '路径验证成功',
      isUrl: true
    }
  } else {
    return {
      msg: '请检查是否选择的是 ' + types + ' 目录',
      isUrl: false
    }
  }
}

module.exports = correct
