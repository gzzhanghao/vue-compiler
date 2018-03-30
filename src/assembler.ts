import { SourceNode, SourceMapGenerator } from 'source-map/source-map'

import { Dictionary } from './types/lib'
import { AssembleInput, AssembleOptions, AssembleResult } from './types/assembler'

interface ExtractedStyle {

  code: string

  map?: SourceMapGenerator
}

export default function assemble(components: AssembleInput, options: AssembleOptions): AssembleResult {
  const sourceMapOptions = { file: options.filename, sourceRoot: options.sourceRoot }

  const extractedStyles: Array<ExtractedStyle> = []
  let hasScopedStyles: boolean = false

  const rootNode: Array<string|SourceNode> = []

  /**
   * Process components.script
   */

  rootNode.push('module.exports = (', options.normalizer, ')({\n')

  if (components.script) {
    rootNode.push('script: function(module, exports) {\n')
    if (components.script.src) {
      rootNode.push('module.exports = ', components.script.sourceNode, '\n')
    } else {
      rootNode.push(components.script.sourceNode, '\n')
    }
    rootNode.push('},\n')
  }

  /**
   * Process components.template
   */

  if (components.template) {
    if (components.template.functional) {
      rootNode.push('functional: true,\n')
    }
    rootNode.push('template: ', components.template.sourceNode, ',\n')
  }

  /**
   * Process components.styles
   */

  if (components.styles.length) {
    const externalStyles = []
    const inlineStyles = []

    let cssModules: Dictionary<Dictionary> = null

    for (const style of components.styles) {

      if (style.scoped) {
        hasScopedStyles = true
      }

      if (style.src) {
        externalStyles.push(style.sourceNode)
        continue
      }

      if (style.cssModules) {
        if (!cssModules) {
          cssModules = {}
        }
        cssModules[style.cssModules.name] = style.cssModules.mapping
      }

      /**
       * Style output
       */

      if (!options.extractStyles) {
        inlineStyles.push(style.sourceNode)
      } else if (options.styleSourceMaps) {
        extractedStyles.push(style.sourceNode.toStringWithSourceMap(sourceMapOptions))
      } else {
        extractedStyles.push({ code: style.sourceNode.toString() })
      }
    }

    /**
     * Bundle styles
     */

    if (hasScopedStyles) {
      rootNode.push('hasScopedStyles: true,\n')
    }

    if (externalStyles.length || inlineStyles.length) {
      rootNode.push('inlineStyles: [\n')
      for (const externalNode of externalStyles) {
        rootNode.push(externalNode, ',\n')
      }
      if (inlineStyles.length) {
        if (options.styleSourceMaps) {
          const inlineNode = new SourceNode(null, null, options.filename, inlineStyles)
          const { code, map } = inlineNode.toStringWithSourceMap(sourceMapOptions)
          rootNode.push(JSON.stringify(`${code}/*# sourceMappingURL=data:application/json;base64,${new Buffer(map.toString()).toString('base64')} */`))
        } else {
          rootNode.push(JSON.stringify(inlineStyles.join('')))
        }
        rootNode.push(',\n')
      }
      rootNode.push('],\n')
    }

    if (cssModules) {
      rootNode.push('cssModules: ', JSON.stringify(cssModules), ',\n')
    }
  }

  /**
   * Custom blocks
   */

  if (components.customBlocks.length) {
    rootNode.push('customBlocks: [\n')
    for (const block of components.customBlocks) {
      rootNode.push('function(module, exports) {\n')
      if (block.src) {
        rootNode.push('module.exports = ', block.sourceNode, '\n')
      } else {
        rootNode.push(block.sourceNode, '\n')
      }
      rootNode.push('},\n')
    }
    rootNode.push('],\n')
  }

  if (options.ssrOptimize) {
    rootNode.push('server: true,\n')
  }

  if (options.hotReload) {
    rootNode.push('hotAPI: module.hot,\n')
  }

  if (options.includeFileName) {
    rootNode.push('file: ', JSON.stringify(options.filename), ',\n')
  }

  rootNode.push(
    'scopeId: ', JSON.stringify(options.scopeId), ',\n',
    '})\n',
  )

  /**
   * Return result
   */

  let result: AssembleResult = null

  if (options.sourceMaps) {
    result = new SourceNode(null, null, options.filename, rootNode).toStringWithSourceMap(sourceMapOptions)
  } else {
    result = { code: rootNode.join('') }
  }

  if (options.extractStyles) {
    result.extractedStyles = extractedStyles
  }

  return result
}
