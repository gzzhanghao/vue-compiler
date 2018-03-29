import postcss from 'postcss'
import postcssModules from 'postcss-modules'
import postcssScopeId from '@vue/component-compiler-utils/dist/stylePlugins/scoped'
import postcssComposition from 'postcss-plugin-composition'
import { SourceNode, SourceMapConsumer } from 'source-map'

/**
 * @param {Object} item
 * @param {Object} options
 */
export default async function compileStyle(item, options) {
  if (item.attrs.src) {
    return
  }

  const { node } = item
  const postcssPlugins = options.postcss.slice()

  /**
   * Module style
   */

  if (item.attrs.module) {
    let name = '$style'
    if (item.attrs.module !== true) {
      name = item.attrs.module
    }
    postcssPlugins.push(postcssComposition([
      postcssModules({
        getJSON(fileName, mapping) {
          item.cssModules = { name, mapping }
        },
        ...options.postcssModules,
      }),
    ]))
  }

  /**
   * Scoped style
   */

  if (item.scoped) {
    postcssPlugins.push(postcssScopeId(options.scopeId))
  }

  /**
   * PostCSS transform
   */

  if (!postcssPlugins.length) {
    return
  }

  const postcssOptions = { map: false, from: item.filePath, to: item.filePath }

  if (options.sourceMap) {
    postcssOptions.map = { inline: false, annotation: false, prev: node.toStringWithSourceMap().map.toJSON() }
  }

  const result = await postcss(postcssPlugins).process(node.toString(), postcssOptions)

  if (!options.sourceMap) {
    item.node = new SourceNode(null, null, item.filePath, result.css)
  } else {
    item.node = SourceNode.fromStringWithSourceMap(result.css, new SourceMapConsumer(result.map.toJSON()))
  }
}
