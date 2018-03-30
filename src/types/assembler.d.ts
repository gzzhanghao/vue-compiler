import { SFCBlock } from './parser'
import { SourceNode, SourceMapGenerator } from 'source-map/source-map'
import { SFCStyleBlock } from './style-compiler'
import { SFCTemplateBlock } from './template-compiler'

export interface AssembleInput {

  script: SFCBlock

  template: SFCTemplateBlock

  styles: Array<SFCStyleBlock>

  customBlocks: Array<SFCBlock>
}

export interface AssembleOptions {

  filename?: string

  scopeId?: string

  normalizer?: SourceNode|string

  extractStyles?: boolean

  sourceMaps?: boolean

  styleSourceMaps?: boolean

  sourceRoot?: string

  ssrOptimize?: boolean

  hotReload?: boolean

  includeFileName?: boolean
}

export interface AssembleResult {

  code: string

  map?: SourceMapGenerator

  extractedStyles?: Array<{ code: string, map?: SourceMapGenerator }>
}
