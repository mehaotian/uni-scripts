/* eslint-disable vue/no-parsing-error */
const path = require('path')
const fs = require('fs-extra')

class Utils {
  // ES6类的静态方法（只能直接由类名调用的方法）：static getInstance
  // ES6类的静态属性：直接挂载在类名上的方法，如：Db.instance()
  static getInstance () {
    if (!Utils.instance) {
      Utils.instance = new Utils()
      return Utils.instance
    }
    return Utils.instance
  }
  constructor () {
    this.disabledTap = true
  }
  init (uniuiPath, uniappPath) {
    this.path = {
      tempCatalog: path.join(uniuiPath, 'temp', 'build_ext'),
      // uni-ui 本地完整地址
      uniUiPagesSrcFiles: path.join(uniuiPath, 'src'),
      exampleCatalog: path.join(uniuiPath, 'temp', 'example'),
      // uni-ui 本地 static 完整地址
      uniUiStaticFile: path.join(uniuiPath, 'src', 'static'),
      // uni-ui 本地 /src/pages 完整地址
      uniUiPagesFiles: path.join(uniuiPath, 'src', 'pages'),
      // uni-ui pages.json
      uniUiPagesJson: path.join(uniuiPath, 'src', 'pages.json'),
      // uni-ui 组件地址
      uniUiComponentsFiles: path.join(uniuiPath, 'src', 'components'),
      appVueFile: path.join(uniuiPath, 'src', 'App.vue'),
      // uni-ui 全局 sass 变量文件
      uniScss: path.join(uniuiPath, 'src', 'uni.scss')
    }

    if (uniappPath) {
      Object.assign(this.path, {
        // hello uni-app 本地 static 完整地址
        outputStaticFile: path.join(uniappPath, 'static'),
        // hello uni-app 组件地址
        uniAppComponentsFiles: path.join(uniappPath, 'components'),
        uniAppPagesJson: path.join(uniappPath, 'pages.json'),
        //  hello uni-app 示例页面
        outputExampleFiles: path.join(uniappPath, 'pages', 'extUI'),
        // hello uni-app tabbar 示例页面
        outputTabBarFile: path.join(uniappPath, 'pages', 'tabBar', 'extUI', 'extUI.nvue'),
        // tabbar 输入 示例页面
        inputTabBarFile: path.join(uniuiPath, 'temp', 'extUI.nvue')
      })
    }
  }
  /**
   * 读取文件
   */
  readFileSync (file) {
    return fs.readFileSync(this.path[file] || file).toString()
  }
  readFile (file) {
    return new Promise((resolve, reject) => {
      fs.readFile(this.path[file] || file, 'utf-8', (err, data) => {
        if (err) {
          reject(new Error(err))
          return
        }
        resolve(data)
      })
    })
  }
  pathjoin (...item) {
    const arr = item.map((item) => {
      return this.path[item] || item
    })
    return path.join(...arr)
  }
  /**
   * 拷贝文件
   * @param {*} frompath 需要被同步的文件路径
   * @param {*} topath 同步到的文件路径
   */
  copy (frompath, topath) {
    return new Promise((resolve, reject) => {
      // console.log(this.path[frompath] || frompath, this.path[topath] || topath)
      fs.copy(this.path[frompath] || frompath, this.path[topath] || topath, (err) => {
        if (err) {
          reject(new Error(err))
          return
        }
        resolve(topath, frompath)
      })
    })
  }
  /**
   * 输出文件
   * @param {*} frompath
   * @param {*} topath
   */
  outputFile (topath, frompath) {
    return new Promise((resolve, reject) => {
      fs.outputFile(this.path[topath] || topath, this.path[frompath] || frompath, (err, res) => {
        if (err) {
          reject(new Error(err))
          return
        }
        resolve(res)
      })
    })
  }
  /**
   * 遍历目录
   * @param {*} path 需要遍历的路径地址
   */
  readdir (path) {
    return new Promise((resolve, reject) => {
      fs.readdir(this.path[path] || path, (err, res) => {
        if (err) {
          reject(new Error(err))
          return
        }
        resolve(res)
      })
    })
  }

  delFiles (filePath, readdirArr) {
    return new Promise((resolve, reject) => {
      this.readdir(filePath).then((fileLists) => {
        fileLists.forEach(function (data) {
          // 获取临时组件目录
          let fileName = path.join(filePath, data)
          // 删除 无用文件
          readdirArr.forEach((file) => {
            if (fileName.indexOf(file) !== -1) {
              fs.removeSync(fileName)
            }
          })
        })
        resolve(filePath)
      })
    })
  }
  /**
   * 删除某个已经存在的目录
   * @param {*} temp
   */
  exists (temp) {
    return new Promise((resolve, reject) => {
      fs.exists(this.path[temp] || temp, (exists) => {
        if (exists) {
          fs.remove(this.path[temp] || temp, (err) => {
            if (err) {
              reject(new Error(err))
              return
            }
            // console.log('---删除目录')
            resolve()
          })
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * 对象转数组
   * @param {*} obj
   */
  promiseToArr (obj) {
    let arr = []
    for (let i in obj) {
      arr.push(obj[i])
    }

    return arr
  }

  /*
 * 方法的实现代码相当酷炫，
 * 实现思路：获取没重复的最右一值放入新数组。
 * （检测到有重复值时终止当前循环同时进入顶层循环的下一轮判断） */
  uniq (array) {
    let temp = []
    let index = []
    let l = array.length
    for (let i = 0; i < l; i++) {
      for (let j = i + 1; j < l; j++) {
        if (array[i] === array[j]) {
          i++
          j = i
        }
      }
      temp.push(array[i])
      index.push(i)
    }
    return temp
  }
}

module.exports = Utils
