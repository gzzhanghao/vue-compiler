import Path from 'path'
import Less from 'less'
import Promisify from 'es6-promisify'
import { transform as BabelTransform } from 'babel-core'

export default {

  babel(filePath, content, options) {
    return BabelTransform(content, Object.assign({

      filename: filePath,
      sourceMaps: true,

    }, options.babel))
  },

  less(filePath, content, options) {
    return Less.render(content, Object.assign({

      filename: filePath,
      sourceMap: options.keepStyleSourceMap ? {} : false,

    }, options.less)).then(res => {

      return { code: res.css, map: res.map }
    })
  },
}
