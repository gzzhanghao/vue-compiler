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

  compilers: {},

  includeFileName: false,

  showDevHints: false,

  postcss: [],

  extractStyles: false,

  styleLoader: 'loadStyle',

  sourceMap: false,

  sourceMapRoot: 'vue:///',

  styleSourceMap: false,

  postcssModules: null,

  hotReload: false,

  compilerOptions: null,

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
  const extractedStyles = []

  let warnings = []

  let hasScopedStyles = false
  let scopeId = null

  /**
   * Process components.script
   */

  if (components.script) {
    if (components.script.attrs.src) {
      rootNode.add(['exports = module.exports = ', components.script.node, '\n'])
    } else {
      rootNode.add(['(function(){\n', components.script.node, '\n})()\n'])
    }
    warnings = warnings.concat(components.script.warnings || [])
  }

  /**
   * Normalize vue_exports and vue_options
   */

  rootNode.add([
    '; (function() {\n',
    'var __vue_exports__ = module.exports || {}\n',
    'if (__vue_exports__.__esModule) {\n',
    '  __vue_exports__ = __vue_exports__.default\n',
    '}\n',
    'var __vue_options__ = __vue_exports__\n',
    'if (typeof __vue_exports__ === "function") {\n',
    '  __vue_options__ = __vue_exports__.options\n',
    '}\n',
  ])

  if (options.includeFileName) {
    rootNode.add(['__vue_options__.__file = ', JSON.stringify(filePath), '\n'])
  }

  if (options.showDevHints) {

    rootNode.add([
      'if (__vue_exports__.__esModule && Object.keys(__vue_exports__).some(function(key) { return key !== "default" && key !== "__esModule" })) {\n',
      '  console.error(', JSON.stringify(`[vue-compiler] ${filePath}: Named exports are not supported in *.vue files.`), ')\n',
      '}\n',
    ])
    if (components.template && !components.template.attrs.functional) {
      rootNode.add([
        'if (__vue_options__.functional) {\n',
        '  console.error(', JSON.stringify(`[vue-compiler] ${filePath}: Functional property should be defined on the <template> tag.`), ')\n',
        '}\n',
      ])
    }
  }

  /**
   * Process components.template
   */

  if (components.template) {
    rootNode.add([
      'var __vue_template__ = ', components.template.node, '\n',
      '__vue_options__.render = __vue_template__.render\n',
      '__vue_options__.staticRenderFns = __vue_template__.staticRenderFns\n',
    ])
    if (components.template.attrs.functional) {
      rootNode.add('__vue_options__.functional = true\n')
    }
    warnings = warnings.concat(components.template.warnings || [])
  }

  /**
   * Process components.styles
   */

  if (components.styles.length) {

    let styleNode = null
    let cssModules = null

    if (!options.extractStyles) {
      styleNode = new SourceNode(null, null, filePath)
    }

    for (const style of components.styles) {

      let node = style.node
      let postcssPlugins = []

      if (style.attrs.src) {
        rootNode.add([node, '\n'])
        continue
      }

      if (options.postcss) {
        postcssPlugins = options.postcss.slice()
      }

      /**
       * Module style
       */

      if (style.module) {

        if (!cssModules) {
          cssModules = Object.create(null)
        }

        const moduleName = (style.module === true) ? '$style' : style.module

        if (cssModules[moduleName]) {
          warnings.push({ msg: `CSS module name '${moduleName}' conflicts`, start: style.blockStart })

          if (options.showDevHints) {
            rootNode.add([
              'console.error(', JSON.stringify(`[vue-compiler] ${filePath}: CSS module name '${moduleName}' already exists.`), ')\n',
            ])
          }
        }

        postcssPlugins.push(PostCSSComposition([
          PostCSSModules({
            getJSON(fileName, json) {
              cssModules[moduleName] = json
            },
            ...options.postcssModules,
          }),
        ]))
      }

      /**
       * Scoped style
       */

      if (style.scoped) {
        if (!scopeId) {
          scopeId = GenId(filePath)
        }
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
        styleNode.add([node, '\n'])
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

    if (!options.extractStyles && styleNode.children.length) {
      rootNode.add([options.styleLoader, '('])
      if (options.styleSourceMap) {
        const result = styleNode.toStringWithSourceMap({ sourceRoot: options.sourceMapRoot })
        rootNode.add(JSON.stringify(result.code + `/*# sourceMappingURL=data:application/json;base64,${new Buffer(result.map.toString()).toString('base64')} */`))
      } else {
        rootNode.add(JSON.stringify(styleNode.toString()))
      }
      if (!scopeId) {
        scopeId = GenId(filePath)
      }
      rootNode.add([', ', JSON.stringify(scopeId)])
      rootNode.add(')\n')
    }

    /**
     * Meta data
     */

    if (hasScopedStyles) {
      rootNode.add(['__vue_options__._scopeId = ', JSON.stringify(scopeId), '\n'])
    }

    if (cssModules) {
      for (const [key, val] of Object.entries(cssModules)) {
        rootNode.add([
          'Object.defineProperty(__vue_options__, ', JSON.stringify(key), ', { get: function() { return ', JSON.stringify(val), ' } })\n',
        ])
      }
    }
  }

  /**
   * Export module
   */

  rootNode.add([
    'module.exports = __vue_exports__\n',
    '})()\n',
  ])

  /**
   * Custom blocks
   */

  for (const block of components.customBlocks) {
    if (block.attrs.src) {
      rootNode.add([
        '; (function() {\n',
        '  var __vue_block__ = ', block.node, '\n',
        '  if (typeof __vue_block__ === "function") {\n',
        '    __vue_block__(module.exports)\n',
        '  }\n',
        '})()\n',
      ])
    } else {
      rootNode.add([
        '; (function(module) {\n',
        '  var exports = module.exports\n',
        '  ; (function() {\n',
        '    ', block.node, '\n',
        '  })()\n',
        '  if (typeof module.exports === "function") {\n',
        '    return module.exports\n',
        '  }\n',
        '  return function() {}\n',
        '})({ exports: {} })(module.exports)\n'
      ])
    }
  }

  /**
   * Hot reload
   */

  if (options.hotReload) {

    if (!scopeId) {
      scopeId = GenId(filePath)
    }

    rootNode.add([
      'if (module.hot) (function() {\n',
      '  var hotAPI = require(', JSON.stringify(options.hotReload.module), ')\n',
      '  module.hot.accept()\n',
      '  if (!module.hot.data) {\n',
      '    hotAPI.createRecord(', JSON.stringify(scopeId), ', module.exports)\n',
      '  } else if (module.exports.functional) {\n',
      '    hotAPI.rerender(', JSON.stringify(scopeId), ', module.exports)\n',
      '  } else {\n',
      '    hotAPI.reload(', JSON.stringify(scopeId), ', module.exports)\n',
      '  }\n',
      '})()\n',
    ])
  }

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

  if (scopeId) {
    result.scopeId = scopeId
  }

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
  let compile = options.getCompiler(item, options)

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

  return
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
      msg.start += item.start
    }
    if (msg.end != null) {
      msg.end += item.start
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

  item.filePath = filePath
  item.content = Array(content.slice(0, item.start).split(/\r?\n/g).length).join('\n') + item.content

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
