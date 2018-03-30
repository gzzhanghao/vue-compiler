import postcss = require('postcss')
import postcssScopeId from '@vue/component-compiler-utils/dist/stylePlugins/scoped'
import { ProcessOptions } from 'postcss'
import { SourceNode, SourceMapConsumer, RawIndexMap } from 'source-map/source-map'

// @ts-ignore
import postcssModules from 'postcss-modules'

// @ts-ignore
import postcssComposition from 'postcss-plugin-composition'

import { SFCBlock } from './types/parser'
import { Dictionary } from './types/lib'
import { CompileStyleOptions, SFCStyleBlock } from './types/style-compiler'

export default async function compileStyle(item: SFCBlock, options: CompileStyleOptions): Promise<SFCStyleBlock> {
  const block: SFCStyleBlock = { ...item, scoped: !!item.attrs.scoped }

  if (block.src) {
    return block
  }

  const plugins = options.postcssPlugins.slice()

  if (block.attrs.module) {
    let name = '$style'
    if (block.attrs.module !== true) {
      name = block.attrs.module
    }
    plugins.push(postcssComposition([
      postcssModules({
        getJSON(fileName: string, mapping: Dictionary) {
          block.cssModules = { name, mapping }
        },
        ...options.postcssModules,
      }),
    ]))
  }

  if (block.scoped) {
    plugins.push(postcssScopeId(options.scopeId))
  }

  if (!plugins.length) {
    return block
  }

  const postcssOptions: ProcessOptions = { from: options.filename, to: options.filename }

  if (options.sourceMaps) {
    postcssOptions.map = { inline: false, annotation: false, prev: block.sourceNode.toStringWithSourceMap({ file: options.filename, sourceRoot: options.sourceRoot }).map.toJSON() }
  }

  const { css, map } = await postcss(plugins).process(block.sourceNode.toString(), postcssOptions)

  if (!options.sourceMaps) {
    block.sourceNode = new SourceNode(null, null, options.filename, css)
    return block
  }

  // @ts-ignore
  const rawSourceMap: RawIndexMap = map.toJSON()
  block.sourceNode = SourceNode.fromStringWithSourceMap(css, await new SourceMapConsumer(rawSourceMap))

  return block
}
