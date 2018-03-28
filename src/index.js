import PostCSS from 'postcss'
import PostCSSModules from 'postcss-modules'
import PostCSSComposition from 'postcss-plugin-composition'

import * as VueCompiler from 'vue-template-compiler'
import { transform as BubleTransform } from 'vue-template-es2015-compiler/buble'
import { SourceNode, SourceMapConsumer } from 'source-map'

import GenId from './GenId'
import PostCSSScope from './PostCSSScope'

/**
 * Default transform options
 */

const DefaultOptions = {

  runtime: 'require("vue-compiler-runtime")',

  includeFileName: false,

  postcss: [],

  extractStyles: false,

  sourceMap: false,

  sourceMapRoot: 'vue:///',

  styleSourceMap: false,

  postcssModules: null,

  compilerOptions: null,

  serverRendering: false,

  compilers: {},

  getCompiler: () => {},
}

/**
 * Compile file into component
 *
 * @param {string}          filePath
 * @param {string}          content
 * @param {CompilerOptions} options_
 * @return {BuildResult | ErrorResult} Compile result
 */
export default async function Compile(filePath, content, options_ = {}) {
  const options = { ...DefaultOptions, ...options_ }
  const components = VueCompiler.parseComponent(content, { outputSourceRange: true })

  if (components.errors && components.errors.length) {
    return { errors: components.errors }
  }

  const promises = [null, null, null]

  if (components.script) {
    setSourceInfo(components.script, filePath, content)
    promises[0] = processItem(components.script, options)
  }

  if (components.template) {
    setSourceInfo(components.template, filePath, content)
    promises[1] = processItem(components.template, options)
      .then(() => compileHtml(components.template, options))
  }

  promises[2] = Promise.all(components.styles.map((style, index) => {
    style.index = index
    setSourceInfo(style, filePath, content)
    return processItem(style, options)
  }))

  promises[3] = Promise.all(components.customBlocks.map((block, index) => {
    block.index = index
    setSourceInfo(block, filePath, content)
    return processItem(block, options)
  }))

  await Promise.all(promises)

  return generate(filePath, components, options)
}

/**
 * Generate source code from given components
 *
 * @param {string}          filePath
 * @param {SFCDescriptor}   components
 * @param {CompilerOptions} options
 * @return {BuildResult} Gnerated result
 */
async function generate(filePath, components, options) {
  const rootNode = new SourceNode(null, null, filePath)
  const hookNode = new SourceNode(null, null, filePath)

  const scopeId = GenId(filePath)
  const extractedStyles = []

  let warnings = []
  let hasScopedStyles = false

  /**
   * Process components.script
   */

  rootNode.add(['module.exports = (', options.runtime, '\n)({\n'])

  if (components.script) {
    rootNode.add('script: function(module, exports) {\n')
    if (components.script.attrs.src) {
      rootNode.add(['module.exports = (', components.script.node, '\n)\n'])
    } else {
      rootNode.add([components.script.node, '\n'])
    }
    rootNode.add('},\n')
    warnings = warnings.concat(components.script.warnings || [])
  }

  /**
   * Process components.template
   */

  if (components.template) {
    rootNode.add(['template: ', components.template.node, ',\n'])
    if (components.template.attrs.functional) {
      rootNode.add('functional: true,\n')
    }
    warnings = warnings.concat(components.template.warnings || [])
  }

  /**
   * Process components.styles
   */

  if (components.styles.length) {
    const externalStyles = []
    const inlineStyles = []

    let hasScopedStyles = false
    let cssModules = null

    for (const style of components.styles) {
      let node = style.node
      let postcssPlugins = []

      if (style.attrs.src) {
        externalStyles.push(node)
        continue
      }

      if (options.postcss) {
        postcssPlugins = options.postcss.slice()
      }

      /**
       * Module style
       */

      if (style.attrs.module) {
        let name = '$style'
        if (style.attrs.module !== true) {
          name = style.attrs.module
        }
        if (!cssModules) {
          cssModules = {}
        }
        postcssPlugins.push(PostCSSComposition([
          PostCSSModules({
            getJSON(fileName, mapping) {
              cssModules[name] = mapping
            },
            ...options.postcssModules,
          }),
        ]))
      }

      /**
       * Scoped style
       */

      if (style.scoped) {
        hasScopedStyles = true
        postcssPlugins.push(PostCSSScope({ scopeId }))
      }

      /**
       * PostCSS transform
       */

      if (postcssPlugins.length) {
        let postcssMapOpts = false

        if (options.styleSourceMap) {
          postcssMapOpts = { inline: false, annotation: false, prev: node.toStringWithSourceMap().map.toJSON() }
        }

        const result = await PostCSS(postcssPlugins).process(node.toString(), { map: postcssMapOpts, from: style.filePath, to: style.filePath })

        if (!options.styleSourceMap) {
          node = new SourceNode(null, null, node.source, result.css)
        } else {
          node = SourceNode.fromStringWithSourceMap(result.css, new SourceMapConsumer(result.map.toJSON()))
        }
      }

      /**
       * Style output
       */

      if (!options.extractStyles) {
        inlineStyles.push(node)
      } else if (options.styleSourceMap) {
        extractedStyles.push(node.toStringWithSourceMap({ sourceRoot: options.sourceMapRoot }))
      } else {
        extractedStyles.push({ code: node.toString() })
      }

      warnings = warnings.concat(style.warnings || [])
    }

    /**
     * Bundle styles
     */

    if (hasScopedStyles) {
      rootNode.add('hasScopedStyles: true,\n')
    }

    if (externalStyles.length || inlineStyles.length) {
      rootNode.add('styles: [\n')
      for (const externalNode of externalStyles) {
        rootNode.add(['(', externalNode, '\n),\n'])
      }
      if (inlineStyles.length) {
        const inlineNode = new SourceNode(null, null, filePath, inlineStyles)
        if (options.styleSourceMap) {
          const result = inlineNode.toStringWithSourceMap({ sourceRoot: options.sourceMapRoot })
          rootNode.add(JSON.stringify(result.code + `/*# sourceMappingURL=data:application/json;base64,${new Buffer(result.map.toString()).toString('base64')} */`))
        } else {
          rootNode.add(JSON.stringify(inlineNode.toString()))
        }
        rootNode.add(',\n')
      }
      rootNode.add('],\n')
    }

    if (cssModules) {
      rootNode.add(['cssModules: ', JSON.stringify(cssModules), ',\n'])
    }
  }

  /**
   * Custom blocks
   */

  if (components.customBlocks.length) {
    rootNode.add('customBlocks: [\n')
    for (const block of components.customBlocks) {
      rootNode.add('function(module, exports) {\n')
      if (block.attrs.src) {
        rootNode.add(['module.exports = (', block.node, '\n)\n'])
      } else {
        rootNode.add([block.node, '\n'])
      }
      rootNode.add('},\n')
      warnings = warnings.concat(block.warnings || [])
    }
    rootNode.add('],\n')
  }

  if (options.includeFileName) {
    rootNode.add(['file: ', JSON.stringify(filePath), ',\n'])
  }

  rootNode.add([
    'scopeId: ', JSON.stringify(scopeId), ',\n',
    '})\n',
  ])

  /**
   * Return result
   */

  let result = null

  if (options.sourceMap) {
    result = rootNode.toStringWithSourceMap({ sourceRoot: options.sourceMapRoot })
  } else {
    result = { code: rootNode.toString() }
  }

  result.warnings = warnings
  result.scopeId = scopeId

  if (options.extractStyles) {
    result.styles = extractedStyles
  }

  return result
}

/**
 * Process the SFCBlock according to its language
 *
 * @param {SFCBlock}        item    The SFCBlock to be compiled
 * @param {CompilerOptions} options
 */
async function processItem(item, options) {
  let compile = await options.getCompiler(item, options)

  if (!compile && compile !== false) {
    compile = options.compilers[item.lang] || options.compilers[item.type]
  }

  if (!compile) {
    return
  }

  const result = await compile(item, options)

  if (!result) {
    return
  }

  item.warnings = result.warnings || []

  if (!options.sourceMap || !result.map) {
    item.node = new SourceNode(null, null, item.filePath, result.code)
  } else {
    item.node = SourceNode.fromStringWithSourceMap(result.code, new SourceMapConsumer(result.map))
  }

  item.node.setSourceContent(item.filePath, item.sourceContent)
}

/**
 * Compile html to vue template functions
 *
 * @param {SFCBlock}        item    The template block
 * @param {CompilerOptions} options
 */
function compileHtml(item, options) {

  if (item.attrs.src) {
    return
  }

  const method = options.serverRendering ? 'ssrCompile' : 'compile'
  const result = VueCompiler.compile(item.node.toString(), { outputSourceRange: true, ...options.compilerOptions })
  const fnArgs = item.attrs.functional ? '_h,_vm' : ''

  let code = `({ render: function(${fnArgs}) { ${result.render} }, staticRenderFns: [ `

  for (const fn of result.staticRenderFns) {
    code += `function(${fnArgs}) { ${fn} }, `
  }

  code += '] })'

  code = BubleTransform(code, { transforms: { stripWith: true, stripWithFunctional: item.attrs.functional } }).code

  item.warnings = item.warnings.concat(result.errors).concat(result.tips)
  item.node = new SourceNode(null, null, item.node.source, code)

  for (const msg of item.warnings) {
    if (msg.start != null) {
      msg.start += item.start - item.line + 1
    }
    if (msg.end != null) {
      msg.end += item.start - item.line + 1
    }
  }
}

/**
 * Set source information for block
 *
 * @param {SFCBlock} item
 * @param {string}   filePath
 * @param {string}   content
 */
function setSourceInfo(item, filePath, content) {
  const lines = item.content.split('\n')

  item.warnings = []

  item.line = content.slice(0, item.start).split(/\r?\n/g).length

  item.sourceContent = content
  item.content = Array(item.line).join('\n') + item.content

  item.filePath = `${filePath}?${item.type}`
  if (item.index != null) {
    item.filePath += `_${item.index}`
  }

  if (!item.attrs) {
    item.attrs = {}
  }

  if (item.attrs.src) {
    item.node = new SourceNode(
      item.line || 1,
      item.column,
      item.filePath,
      `require(${JSON.stringify(item.attrs.src)})`
    )
    return
  }

  item.node = new SourceNode(null, null, filePath, lines.map((content, line) => {
    let lineEnding = ''

    if (line + 1 < lines.length) {
      lineEnding = '\n'
    }

    return new SourceNode(
      (item.line || 1) + line,
      line ? 0 : item.column,
      filePath,
      content + lineEnding
    )
  }))
}
