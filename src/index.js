import parse from './parser'
import assemble from './assembler'
import processItem from './item-processor'
import compileTemplate from './template-compiler'

/**
 * Default transform options
 */

const DefaultOptions = {

  normalizer: 'require("component-normalizer")',

  includeFileName: false,

  postcss: [],

  extractStyles: false,

  sourceMap: false,

  sourceMapRoot: 'vue:///',

  styleSourceMap: false,

  postcssModules: null,

  compilerOptions: null,

  serverRendering: false,

  hotReload: false,

  compilers: {},

  getCompiler: () => {},
}

/**
 * Compile file into component
 *
 * @param {string}          filePath
 * @param {string}          content
 * @param {CompilerOptions} options_
 * @return {BuildResult} Compile result
 */
export default async function compile(filePath, content, options_ = {}) {
  const options = { ...DefaultOptions, ...options_ }

  const components = parse(filePath, content, options)

  const promises = [null, null, null]

  if (components.script) {
    promises[0] = processItem(components.script, options)
  }

  if (components.template) {
    promises[1] = processItem(components.template, options)
      .then(() => compileTemplate(components.template, options))
  }

  promises[2] = Promise.all(components.styles.map((style) => {
    return processItem(style, options)
  }))

  promises[3] = Promise.all(components.customBlocks.map((block) => {
    return processItem(block, options)
  }))

  await Promise.all(promises)

  return assemble(filePath, components, options)
}
