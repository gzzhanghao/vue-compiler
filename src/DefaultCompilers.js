export default {

  babel(filePath, content, options) {
    const Babel = require('babel-core')

    return Babel.transform(content, Object.assign({

      filename: filePath,
      sourceMaps: true,

    }, options.babel))
  },

  less(filePath, content, options) {
    const Less = require('less')

    return Less.render(content, Object.assign({

      filename: filePath,
      sourceMap: options.keepStyleSourceMap ? {} : false,

    }, options.less)).then(res => {

      return { code: res.css, map: res.map }
    })
  },
}
