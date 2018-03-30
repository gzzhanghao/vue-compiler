import { SourceNode } from 'source-map'

import {
  ParseOptions,
  SFCDescriptor,
  SFCBlock,
  VueSFCBlock,
  VueSFCDescriptor,
  SFCBlockOptions,
} from './types/parser'

const { parseComponent } = require('vue-template-compiler')

const LINE_SPLITTER = /\r?\n/g

export default function parse(source: string, options: ParseOptions): SFCDescriptor {
  const descriptor: VueSFCDescriptor = parseComponent(source, options.parseOptions)

  const blockOptions: SFCBlockOptions = {
    source,
    filename: options.filename,
    sourceMaps: options.sourceMaps,
    sourceRoot: options.sourceRoot,
  }

  return {
    script: descriptor.script && bindSFCBlock(descriptor.script, blockOptions),
    template: descriptor.template && bindSFCBlock(descriptor.template, blockOptions),
    styles: descriptor.styles.map((block, index) => bindSFCBlock(block, blockOptions, index)),
    customBlocks: descriptor.customBlocks.map((block, index) => bindSFCBlock(block, blockOptions, index)),
  }
}

function bindSFCBlock(vueBlock: VueSFCBlock, options: SFCBlockOptions, index?: number): SFCBlock {
  const block: SFCBlock = {
    index,
    type: vueBlock.type,
    attrs: vueBlock.attrs,
    sourceNode: new SourceNode(null, null, options.filename),
    loc: {
      start: getLoc(vueBlock.start, options.source),
      end: getLoc(vueBlock.end, options.source),
    },
  }

  if (typeof block.attrs.src === 'string') {
    block.src = block.attrs.src
  }

  const startLine = block.loc.start.line

  block.sourceNode.setSourceContent(options.filename, options.source)

  if (block.src) {
    block.sourceNode.add(new SourceNode(startLine + 1, 0, options.filename, `require(${JSON.stringify(block.src)})`))
    return block
  }

  if (!options.sourceMaps) {
    block.sourceNode.add(vueBlock.content)
    return block
  }

  vueBlock.content.split(LINE_SPLITTER).forEach((line, index) => {
    block.sourceNode.add(new SourceNode(
      startLine + index + 1,
      index ? 0 : block.loc.start.column,
      options.filename,
      [line, '\n']
    ))
  })

  return block
}

function getLoc(index: number, source: string) {
  const lines = source.slice(0, index).split(LINE_SPLITTER)
  return { index, line: lines.length - 1, column: lines[lines.length - 1].length }
}
