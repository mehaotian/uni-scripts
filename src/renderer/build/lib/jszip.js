const fs = require('fs-extra') // 获取文件系统模块，负责读写文件
let path = require('path') // 工具模块，处理文件路径的小工具
let JSZIP = require('jszip')

// 读取目录及文件
const readDir = (obj, nowPath) => {
  console.log('读取目录', nowPath)
  let files = fs.readdirSync(nowPath) // 读取目录中的所有文件及文件夹（同步操作）
  files.forEach((fileName, index) => { // 遍历检测目录中的文件
    let fillPath = nowPath + '/' + fileName
    let file = fs.statSync(fillPath) // 获取一个文件的属性
    if (file.isDirectory()) { // 如果是目录的话，继续查询
      let dirlist = obj.folder(fileName) // 压缩对象中生成该目录
      readDir(dirlist, fillPath) // 重新检索目录文件
    } else {
      obj.file(fileName, fs.readFileSync(fillPath)) // 压缩目录添加文件
    }
  })
}

// 开始压缩文件
const startZIP = (inputPath, outPath, name) => {
  let zip = new JSZIP()
  readDir(zip, inputPath)
  console.log('-------------')
  return new Promise((resolve, reject) => {
    zip.generateAsync({ // 设置压缩格式，开始打包
      type: 'nodebuffer', // nodejs用
      compression: 'DEFLATE', // 压缩算法
      compressionOptions: { // 压缩级别
        level: 9
      }
    }).then(function (content) {
      // 将打包的内容写入 当前目录下的 result.zip中
      fs.outputFile(path.join(outPath, `${name}.zip`), content, 'utf-8', function (param) {
        resolve()
      })
    })
  })
}

module.exports = startZIP
