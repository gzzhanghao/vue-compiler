import transpile from 'vue-template-es2015-compiler'
import { SourceNode } from 'source-map'
import * as VueCompiler from 'vue-template-compiler'

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

  code = transpile(code, { transforms: { stripWithFunctional: item.attrs.functional } })

  item.warnings = item.warnings.concat(result.errors).concat(result.tips)
  item.node = new SourceNode(null, null, item.node.source, code)
}
