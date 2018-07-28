import { compile, compileSync } from './compiler'

import parse from './parser'
import assemble from './assembler'
import compileTemplate from './template-compiler'
import { compileStyle, compileStyleSync } from './style-compiler'

export default compile

export {
  compile,
  compileSync,
  parse,
  compileTemplate,
  compileStyle,
  compileStyleSync,
  assemble,
}
