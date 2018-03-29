import { SourceNode } from 'source-map'
import * as VueCompiler from 'vue-template-compiler'
import { transform as bubleTransform } from 'vue-template-es2015-compiler/buble'

/**
 * Compile html to vue template functions
 *
 * @param {SFCBlock}        item    The template block
 * @param {CompilerOptions} options
 */
export default function compileTemplate(item, options) {
  if (item.attrs.src) {
    return
  }

  const method = options.serverRendering ? 'ssrCompile' : 'compile'
  const result = VueCompiler[method](item.node.toString(), options.compilerOptions)
  const fnArgs = item.attrs.functional ? '_h,_vm' : ''

  let code = `({ render: function(${fnArgs}) { ${result.render} }, staticRenderFns: [ `

  for (const fn of result.staticRenderFns) {
    code += `function(${fnArgs}) { ${fn} }, `
  }

  code += '] })'

  code = bubleTransform(code, { transforms: { stripWith: true, stripWithFunctional: item.attrs.functional } }).code

  item.warnings = item.warnings.concat(result.errors).concat(result.tips)
  item.node = new SourceNode(null, null, item.node.source, code)
}
