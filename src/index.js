import Fs from 'fs'
import Path from 'path'
import CSSNano from 'cssnano'
import PostCSS from 'postcss'
import Promisify from 'es6-promisify'
import PostCSSModules from '@gzzhanghao/postcss-modules'

import * as VueCompiler from 'vue-template-compiler'
import { transform as BubleTransform } from 'vue-template-es2015-compiler/buble'
import { SourceNode, SourceMapConsumer, SourceMapGenerator } from 'source-map'

import GenId from './GenId'
import PostCSSScope from './PostCSSScope'
import DefaultCompilers from './DefaultCompilers'

const readFile = Promisify(Fs.readFile)

/**
 * Default transform options
 */
const defaultOptions = {

  compilers: DefaultCompilers,

  includeFileName: false,

  showDevHints: false,

  babel: false,

  less: false,

  postcss: false,

  cssnano: false,

  extractStyles: false,

  styleLoader: 'loadStyle',

  sourceMap: false,

  sourceMapRoot: 'vue:///',

  styleSourceMap: false,
}

/**
 * Compile file into component
 *
 * @param {string} filePath
 * @param {string} content
 * @param {Object} options_
 * @return {Object} Compile result
 */
export default async function Compile(filePath, content, options_) {
  const options = Object.assign({}, defaultOptions, options_)
  const components = VueCompiler.parseComponent(content, { pad: true })

  options.compilers = Object.assign({}, DefaultCompilers, options.compilers)

  if (components.template) {
    const leading = content.slice(0, components.template.start).split('\n')
    components.template.line = leading.length
    components.template.column = leading[leading.length - 1].length + 1
  }

  const promises = [null, null, null]

  if (components.script) {
    const defaultLang = options.babel ? 'babel' : 'javascript'
    promises[0] = processItem(filePath + '?script', components.script, defaultLang, options)
  }


  if (components.template) {
    promises[1] = processItem(filePath + '?template', components.template, 'html', options).then(compileHtml)
  }

  promises[2] = Promise.all(components.styles.map((style, index) => {
    return processItem(filePath + '?style_' + index, style, 'css', options)
  }))

  const result = await Promise.all(promises)

  return generate(filePath, { script: result[0], template: result[1], styles: result[2] }, content, options)
}

/**
 * Generate source code from given components
 *
 * @param {string} filePath
 * @param {Object} components
 * @param {string} content
 * @param {Object} options
 * @return {Object} Gnerated result
 */
async function generate(filePath, components, content, options) {
  const rootNode = new SourceNode(null, null, filePath)
  const extractedStyles = []

  let warnings = []

  let modules = null
  let scopeId = null

  /**
   * Process components.script
   */

  if (components.script) {
    if (components.script.src) {
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
      `  console.error("[vue-compiler]", ${JSON.stringify(filePath)}, ": Named exports are not supported in *.vue files.")\n`,
      '}\n',
      'if (__vue_options__.functional) {\n',
      `  console.error("[vue-compiler]", ${JSON.stringify(filePath)}, ": Functional components are not supported and should be defined in plain js files using render functions.")\n`,
      '}\n',
    ])
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
    warnings = warnings.concat(components.template.warnings || [])
  }

  /**
   * Process components.styles
   */

  if (components.styles.length) {
    let styleNode = null

    if (!options.extractStyles) {
      styleNode = new SourceNode(null, null, filePath)
    }

    for (const style of components.styles) {

      let node = style.node
      let postcssPlugins = []

      if (style.src) {
        rootNode.add([node, '\n'])
        continue
      }

      if (options.postcss) {
        postcssPlugins = options.postcss.slice(1)
      }

      /**
       * Module style
       */

      if (style.module) {

        if (!modules) {
          modules = Object.create(null)
        }

        const moduleName = (style.module === true) ? '$style' : style.module

        if (modules[moduleName]) {
          warnings.push(new Error(`CSS module name '${moduleName}' conflicts in '${filePath}'`))

          if (options.showDevHints) {
            rootNode.add([
              `console.error("[vue-compiler]", ${JSON.stringify(filePath)}, ": CSS module name", ${JSON.stringify(moduleName)}, "conflicts")\n`,
            ])
          }
        }

        postcssPlugins.push(PostCSSModules({
          getJSON(fileName, json) {
            modules[moduleName] = json
          },
        }))
      }

      /**
       * Scoped style
       */

      if (style.scoped) {
        if (!scopeId) {
          scopeId = GenId(filePath)
        }
        postcssPlugins.push(PostCSSScope({ scopeId }))
      }

      /**
       * Minify style
       */

      if (options.cssnano) {
        postcssPlugins.push(CSSNano(Object.assign({ safe: true }, options.cssnano)))
      }

      /**
       * Post css transform
       */

      if (postcssPlugins.length) {
        let postcssMapOpts = false

        if (options.styleSourceMap) {
          postcssMapOpts = { inline: false, annotation: false, prev: node.toStringWithSourceMap().map.toJSON() }
        }

        const result = await PostCSS(postcssPlugins).process(node.toString(), { map: postcssMapOpts, from: filePath, to: filePath })

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

    if (styleNode.children.length) {
      rootNode.add([options.styleLoader, '('])
      if (options.styleSourceMap) {
        const result = styleNode.toStringWithSourceMap({ sourceRoot: options.sourceMapRoot })
        rootNode.add(JSON.stringify(result.code + `/*# sourceMappingURL=data:application/json;base64,${new Buffer(result.map.toString()).toString('base64')} */`))
      } else {
        rootNode.add(JSON.stringify(styleNode.toString()))
      }
      rootNode.add(')\n')
    }

    /**
     * Meta data
     */

    if (scopeId) {
      rootNode.add(['__vue_options__._scopeId = ', JSON.stringify(scopeId), '\n'])
    }

    if (modules) {
      rootNode.add([
        'var __vue_styles__ = ', JSON.stringify(modules), '\n',
        'if (!__vue_options__.computed) {\n',
        '  __vue_options__.computed = {}\n',
        '}\n',
        'Object.keys(__vue_styles__).forEach(function(key) {\n',
        '  var module = __vue_styles__[key]\n',
        '  __vue_options__.computed[key] = function() { return module }\n',
        '})\n',
      ])
    }
  }

  /**
   * Export module
   */

  rootNode.add(['module.exports = __vue_exports__\n'])

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

  if (options.extractStyles) {
    result.styles = extractedStyles
  }

  return result
}

/**
 * Process component item according to it's language
 *
 * @param {string} filePath
 * @param {Object} item
 * @param {string} defaultLang
 * @param {Object} options
 * @return {Object} The component item
 */
async function processItem(filePath, item, defaultLang, options) {

  if (item.src) {
    item.node = new SourceNode(
      item.line || 1,
      item.column,
      filePath,
      `require(${JSON.stringify(item.src)})`
    )
    return item
  }

  const compile = options.compilers[item.lang || defaultLang]

  item.warnings = []

  if (!compile) {
    const lines = item.content.split('\n')

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

    item.node.setSourceContent(filePath, item.content)

    return item
  }

  const result = await compile(filePath, item.content, options)

  item.warnings = result.warnings || []

  if (!options.sourceMap || !result.map) {
    item.node = new SourceNode(null, null, filePath, result.code)
  } else {
    item.node = SourceNode.fromStringWithSourceMap(result.code, new SourceMapConsumer(result.map))
  }

  item.node.setSourceContent(filePath, item.content)

  return item
}

/**
 * Compile html to vue template functions
 *
 * @param {Object} item
 * @return {Object} The component item
 */
function compileHtml(item) {
  const result = VueCompiler.compile(item.node.toString())
  let code = `({ render: function() { ${result.render} }, staticRenderFns: [ `

  for (const fn of result.staticRenderFns) {
    code += `function() { ${fn} }, `
  }

  code += '] })'

  code = BubleTransform(code, { transforms: { stripWith: true } }).code

  item.warnings = item.warnings.concat(result.errors)
  item.node = new SourceNode(null, null, item.node.source, code)

  return item
}
