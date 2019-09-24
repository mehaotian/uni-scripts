const path = require('path')
const fs = require('fs-extra')
const glob = require('glob')

function transform (loaclPath) {
  const inputFile = path.join(loaclPath, './src/components')
  const vueFiles = glob.sync(inputFile + '/**/*.json')
  let content = []
  vueFiles.forEach(name => {
    if (!~name.indexOf('config.json')) {
      return
    }
    const data = fs.readFileSync(name, 'utf8')
    content.push(JSON.parse(data))
  })
  return content
}

module.exports = transform
