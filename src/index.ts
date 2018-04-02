import compile from './compiler'

import parse from './parser'
import compileTemplate from './template-compiler'
import compileStyle from './style-compiler'
import assemble from './assembler'

export default compile

export {
  compile,
  parse,
  compileTemplate,
  compileStyle,
  assemble,
}
