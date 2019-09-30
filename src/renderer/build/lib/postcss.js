const postcss = require('postcss') // postcss
// const postcssJs = require('postcss-js') // css
// const autoprefixer = require('autoprefixer') // 自动前缀
// const nested = require('postcss-nested') // 嵌套语法
const variables = require('postcss-simple-vars') // 支持变量 如:root{--a:#333}
const postcssComment = require('postcss-comment') // 支持 sass 注释
// const mixins = require('postcss-mixins') // 支持 mixins
const processCssJs = (cssJs) => {
  return postcss([variables]).process(
    cssJs, {parser: postcssComment}).css
}

module.exports = processCssJs
