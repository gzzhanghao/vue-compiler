export default {

  babel(filePath, content, options) {
    const Babel = require('babel-core')

    return Babel.transform(content, Object.assign({

      filename: filePath,
      sourceFileName: filePath,
      sourceMaps: true,

    }, options.babel))
  },
}
