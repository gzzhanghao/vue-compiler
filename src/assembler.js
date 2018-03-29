import postcss from 'postcss'
import postcssModules from 'postcss-modules'
import postcssScopeId from '@vue/component-compiler-utils/dist/stylePlugins/scoped'
import postcssComposition from 'postcss-plugin-composition'
import { SourceNode, SourceMapConsumer } from 'source-map'

import { genId } from './utils'

/**
 * Generate source code from given components
 *
 * @param {string}          filePath
 * @param {SFCDescriptor}   components
 * @param {CompilerOptions} options
 * @return {BuildResult} Gnerated result
 */
export default async function assemble(filePath, components, options) {
  const rootNode = new SourceNode(null, null, filePath)

  const scopeId = genId(filePath)
  const extractedStyles = []

  let warnings = []
  let hasScopedStyles = false

  /**
   * Process components.script
   */

  rootNode.add(['module.exports = (', options.normalizer, '\n)({\n'])

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

    let cssModules = null

    for (const style of components.styles) {
      let node = style.node

      if (style.attrs.src) {
        externalStyles.push(node)
        continue
      }

      const postcssPlugins = options.postcss.slice()

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
        postcssPlugins.push(postcssComposition([
          postcssModules({
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
        postcssPlugins.push(postcssScopeId(scopeId))
      }

      /**
       * PostCSS transform
       */

      if (postcssPlugins.length) {
        let postcssMapOpts = false

        if (options.styleSourceMap) {
          postcssMapOpts = { inline: false, annotation: false, prev: node.toStringWithSourceMap().map.toJSON() }
        }

        const result = await postcss(postcssPlugins).process(node.toString(), { map: postcssMapOpts, from: style.filePath, to: style.filePath })

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
      rootNode.add('inlineStyles: [\n')
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

  if (options.serverRendering) {
    rootNode.add('server: true,\n')
  }

  if (options.hotReload) {
    rootNode.add('hotAPI: module.hot,\n')
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
    result.extractedStyles = extractedStyles
  }

  return result
}
