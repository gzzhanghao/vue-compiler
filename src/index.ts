// @ts-ignore
import * as defaultsDeep from 'lodash.defaultsdeep'

import proc from './processor'
import parse from './parser'
import assemble from './assembler'
import compileStyle from './style-compiler'
import compileTemplate from './template-compiler'
import * as defaultOptions from './default-options'

import { genId } from './utils'

import { SFCDescriptor } from './types/parser'
import { CompileOptions, CompileResult } from './types/compiler'

export default async function compile(content: string, options: CompileOptions = {}): Promise<CompileResult> {
  options = defaultsDeep({}, options, defaultOptions[options.mode || 'production'], {
    scopeId: genId(options.filename),
  })

  const sourceMapOptions = {
    filename: options.filename,
    sourceMaps: options.sourceMaps,
    sourceRoot: options.sourceRoot,
  }

  const components: SFCDescriptor = parse(content, { ...sourceMapOptions, ...options.parseOptions })

  const promises: Array<Promise<any>> = [null, null, null]

  if (components.script) {
    promises[0] = proc(components.script, options.processOptions)
  }

  if (components.template) {
    promises[1] = proc(components.template, options.processOptions)
      .then((item) => compileTemplate(item, { ...options.templateOptions, ssrOptimize: options.ssrOptimize }))
  }

  promises[2] = Promise.all(components.styles.map((style) => {
    return proc(style, options.processOptions)
      .then((item) => compileStyle(item, { scopeId: options.scopeId, ...sourceMapOptions, ...options.styleOptions }))
  }))

  promises[3] = Promise.all(components.customBlocks.map((block) => {
    return proc(block, options.processOptions)
  }))

  const [script, template, styles, customBlocks] = await Promise.all(promises)

  const assembleResult = assemble({ script, template, styles, customBlocks }, {
    styleSourceMaps: options.sourceMaps,
    ssrOptimize: options.ssrOptimize,
    scopeId: options.scopeId,
    ...sourceMapOptions,
    ...options.assembleOptions,
  })

  return {
    ...assembleResult,
    scopeId: options.scopeId,
    tips: template.tips,
    errors: template.errors,
    functional: !!template.functional,
  }
}
