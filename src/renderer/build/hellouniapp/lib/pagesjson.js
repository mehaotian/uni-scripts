const beautify = require('js-beautify')

const syncPageJson = (util) => {
  return new Promise((resolve) => {
    const pageJsonData = util.readFileSync('uniUiPagesJson').toString()
    let outputPagesJsonData = util.readFileSync('uniAppPagesJson').toString()
    const pagesJson = JSON.parse(pageJsonData)
    pagesJson.pages.shift()
    let examplePages = pagesJson.pages
    let exampleSubPackages = {
      'pages': []
    }

    examplePages.forEach(value => {
      value.path = value.path.replace('pages/vue/', '')
      exampleSubPackages.pages.push(value)
    })
    // 替换uni-ui 的pages.json 到helli uni-app pages.json 的正确位置
    outputPagesJsonData = outputPagesJsonData.replace(/"pages\/extUI"[\s\S]*"pages\/template"/, value => {
      return `"pages/extUI" ,\n"pages":${JSON.stringify(exampleSubPackages.pages, '', 4)}},\n{\n"root" : "pages/template"`
    })
    outputPagesJsonData = beautify.js(outputPagesJsonData, {
      indent_size: 4,
      indent_with_tabs: true
    })
    util.outputFile('uniAppPagesJson', outputPagesJsonData).then(() => {
      console.log('---- 同步pages.json完成 ----')
      resolve()
    })
  })
}

export default syncPageJson
