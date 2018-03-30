import { Dictionary } from './lib'
import { RawSourceMap, SourceNode } from 'source-map/source-map'

export interface ParseOptions {

  parseOptions?: Object
  // options passed to vue-template-compiler

  filename?: string
  // source file name

  sourceMaps?: boolean
  // enable sourcemap

  sourceRoot?: string
  // sourcemap root
}

export interface SFCDescriptor {

  script?: SFCBlock

  template?: SFCBlock

  styles: SFCBlock[]

  customBlocks: SFCBlock[]
}

export interface SFCBlock {

  type: string
  // block type

  src?: string
  // src attribute

  attrs: Dictionary<string|boolean>
  // block attributes

  sourceNode: SourceNode
  // block source node

  index?: number
  // index of the style / custom block

  loc: { start: Loc, end: Loc }
  // block location information
}

export interface Loc {

  index: number
  // location index

  line: number
  // zero-base line number

  column: number
  // zero-base column number
}

export interface VueSFCBlock {

  type: string
  // block type

  attrs: Dictionary<string|boolean>
  // block attributes

  content: string
  // block content

  start: number
  // starting index

  end: number
  // ending index
}
