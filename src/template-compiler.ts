import { SourceNode } from 'source-map'

import {
  CompileTemplateOptions,
  SFCTemplateBlock,
} from './types/template-compiler'

import { SFCBlock } from './types/parser'

const transpile = require('vue-template-es2015-compiler')

export default function compileTemplate(item: SFCBlock, options: CompileTemplateOptions): SFCTemplateBlock {
  const block: SFCTemplateBlock = { ...item, functional: !!item.attrs.functional }

  if (block.src) {
    return block
  }

  let compile = options.compile

  if (!compile) {
    compile = require('vue-template-compiler')[options.ssrOptimize ? 'ssrCompile' : 'compile']
  }

  const fnArgs = block.functional ? '_h,_vm' : ''
  const result = compile(block.sourceNode.toString(), options.compileOptions)

  block.compileResult = result

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
