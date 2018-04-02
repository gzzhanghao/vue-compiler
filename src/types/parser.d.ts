import {
  RawSourceMap,
  SourceNode,
} from 'source-map'

import { Dictionary } from './lib'

export interface ParseOptions {

  parseOptions?: Object

  filename?: string

  sourceMaps?: boolean

  sourceRoot?: string
}

export interface SFCDescriptor {

  script?: SFCBlock

  template?: SFCBlock

  styles: Array<SFCBlock>

  customBlocks: Array<SFCBlock>
}

export interface SFCBlock {

  type: string

  src?: string

  attrs: Dictionary<string|boolean>

  sourceNode: SourceNode

  index?: number

  loc: { start: Loc, end: Loc }
}

export interface Loc {

  index: number

  line: number

  column: number
}

export interface VueSFCBlock {

  type: string

  attrs: Dictionary<string|boolean>

  content: string

  start: number

  end: number
}

export interface VueSFCDescriptor {

  script?: VueSFCBlock

  template?: VueSFCBlock

  styles: Array<VueSFCBlock>

  customBlocks: Array<VueSFCBlock>
}

export interface SFCBlockOptions {

  filename: string

  source: string

  sourceMaps?: boolean

  sourceRoot?: string
}
