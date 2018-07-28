import defaultsDeep = require('lodash.defaultsdeep')

import parse from './parser'
import assemble from './assembler'
import compileTemplate from './template-compiler'
import { proc, procSync } from './processor'
import { compileStyle, compileStyleSync } from './style-compiler'

import { SFCBlock } from './types/parser'
import { AssembleInput } from './types/assembler'
import { SFCStyleBlock } from './types/style-compiler'
import { SFCTemplateBlock } from './types/template-compiler'

import {
  CompileOptions,
  CompileResult,
} from './types/compiler'

import { genId } from './utils'
import * as defaultOptions from './default-options'

export async function compile(content: string, options: CompileOptions = {}): Promise<CompileResult> {
  options = normalizeOptions(options)

  const components = parseComponent(content, options)

  const promises: Array<Promise<any>> = []

  if (components.script) {
    promises[0] = proc(components.script, options.processOptions)
  }

  if (components.template) {
    promises[1] = proc(components.template, options.processOptions, getTemplateCompiler(options))
  }

  const styleCompiler = getStyleCompiler(compileStyle, options)

  promises[2] = Promise.all(components.styles.map((style) => {
    return proc(style, options.processOptions, styleCompiler)
  }))

  promises[3] = Promise.all(components.customBlocks.map((block) => {
    return proc(block, options.processOptions)
  }))

  const [script, template, styles, customBlocks] = await Promise.all(promises)

  return generateResult({ script, template, styles, customBlocks }, options)
}

export function compileSync(content: string, options: CompileOptions = {}): CompileResult {
  options = normalizeOptions(options)

  const components = parseComponent(content, options)

  let script: SFCBlock

  if (components.script) {
    script = procSync(components.script, options.processOptions)
  }

  let template: SFCTemplateBlock

  if (components.template) {
    template = <SFCTemplateBlock> procSync(
      components.template,
      options.processOptions,
      getTemplateCompiler(options)
    )
  }

  const styleCompiler = getStyleCompiler(compileStyleSync, options)

  const styles = components.styles.map((style) => {
    return <SFCStyleBlock> procSync(style, options.processOptions, styleCompiler)
  })

  const customBlocks = components.customBlocks.map((block) => {
    return procSync(block, options.processOptions)
  })

  return generateResult({ script, template, styles, customBlocks }, options)
}

function normalizeOptions(options: CompileOptions) {
  options = defaultsDeep({}, options, defaultOptions[options.mode || 'production'])
  if (options.scopeId == null) {
    options.scopeId = genId(options.filename)
  }
  return options
}

function parseComponent(content: string, options: CompileOptions) {
  return parse(content, {
    filename: options.filename,
    sourceMaps: options.sourceMaps,
    sourceRoot: options.sourceRoot,
    ...options.parseOptions
  })
}

function getTemplateCompiler(options: CompileOptions) {
  return (item: SFCBlock) => compileTemplate(item, {
    ...options.templateOptions,
    ssrOptimize: options.ssrOptimize,
  })
}

function getStyleCompiler(compile: Function, options: CompileOptions) {
  return (item: SFCBlock) => compile(item, {
    scopeId: options.scopeId,
    filename: options.filename,
    sourceMaps: options.sourceMaps,
    sourceRoot: options.sourceRoot,
    ...options.styleOptions,
  })
}

function generateResult(components: AssembleInput, options: CompileOptions) {
  const assembleResult = assemble(components, {
    styleSourceMaps: options.sourceMaps,
    ssrOptimize: options.ssrOptimize,
    scopeId: options.scopeId,
    filename: options.filename,
    sourceMaps: options.sourceMaps,
    sourceRoot: options.sourceRoot,
    ...options.assembleOptions,
  })

  const result: CompileResult = { ...assembleResult, scopeId: options.scopeId }

  if (components.template) {
    result.tips = components.template.tips
    result.errors = components.template.errors
    result.functional = !!components.template.functional
  }

  return result
}
