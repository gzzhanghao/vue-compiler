// @ts-ignore
import transpile = require('vue-template-es2015-compiler')
// @ts-ignore
import * as VueCompiler from 'vue-template-compiler'

import { SFCBlock } from './types/parser'
import { SourceNode } from 'source-map/source-map'
import { CompileTemplateOptions, SFCTemplateBlock } from './types/template-compiler'

export default function compileTemplate(item: SFCBlock, options: CompileTemplateOptions): SFCTemplateBlock {
  const block: SFCTemplateBlock = { ...item, functional: !!item.attrs.functional }

  if (block.src) {
    return block
  }

  const method = options.ssrOptimize ? 'ssrCompile' : 'compile'
  const fnArgs = block.functional ? '_h,_vm' : ''

  const result = VueCompiler[method](block.sourceNode.toString(), options.compileOptions)

  if (result.errors && result.errors.length) {
    block.errors = result.errors
  }

  let code = `({ render: function(${fnArgs}) { ${result.render} }, staticRenderFns: [ `
  for (const fn of result.staticRenderFns) {
    code += `function(${fnArgs}) { ${fn} }, `
  }
  code += '] })'
  code = transpile(code, { transforms: { stripWithFunctional: block.functional } })

  if (result.tips && result.tips.length) {
    block.tips = result.tips
  }

  block.sourceNode = new SourceNode(null, null, options.filename, code)

  return block
}
