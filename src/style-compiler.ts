import postcssScopeId from '@vue/component-compiler-utils/dist/stylePlugins/scoped'

import {
  ProcessOptions,
  Result,
  LazyResult
} from 'postcss'

import { SourceNode, SourceMapConsumer } from 'source-map'

import postcss = require('postcss')

import { SFCBlock } from './types/parser'
import { Dictionary } from './types/lib'
import { CompileStyleOptions, SFCStyleBlock } from './types/style-compiler'

const postcssModules = require('postcss-modules')
const postcssComposition = require('postcss-plugin-composition')

export async function compileStyle(item: SFCBlock, options: CompileStyleOptions): Promise<SFCStyleBlock> {
  const block: SFCStyleBlock = { ...item, scoped: !!item.attrs.scoped }
  return normalizeResult(block, options, await compile(block, options))
}

export function compileStyleSync(item: SFCBlock, options: CompileStyleOptions): SFCStyleBlock {
  const block: SFCStyleBlock = { ...item, scoped: !!item.attrs.scoped }
  return normalizeResult(block, options, compile(block, options))
}

function compile(block: SFCStyleBlock, options: CompileStyleOptions): LazyResult | void {
  if (block.src) {
    return
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
    return
  }

  const postcssOptions: ProcessOptions = { from: options.filename, to: options.filename }

  if (options.sourceMaps) {
    const inputSourceMap: any = block.sourceNode.toStringWithSourceMap({ file: options.filename, sourceRoot: options.sourceRoot }).map
    postcssOptions.map = { inline: false, annotation: false, prev: inputSourceMap.toJSON() }
  }

  return postcss(plugins).process(block.sourceNode.toString(), postcssOptions)
}

function normalizeResult(block: SFCStyleBlock, options: CompileStyleOptions, result: LazyResult | Result | void): SFCStyleBlock {
  if (!result) {
    return block
  }
  const { css, map } = result
  if (map) {
    block.sourceNode = SourceNode.fromStringWithSourceMap(css, new SourceMapConsumer(map.toJSON() as any))
  } else {
    block.sourceNode = new SourceNode(null, null, options.filename, css)
  }
  return block
}
