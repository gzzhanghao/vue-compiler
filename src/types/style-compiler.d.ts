import { Dictionary } from './lib'
import { SourceNode } from 'source-map'
import { SFCBlock } from './parser'

export interface CompileStyleOptions {

  scopeId?: string

  postcssPlugins?: Array<any>

  postcssModules?: Object

  sourceMaps?: boolean

  filename?: string

  sourceRoot?: string
}

export interface SFCStyleBlock extends SFCBlock {

  scoped: boolean

  cssModules?: { name: string, mapping: Dictionary }
}
