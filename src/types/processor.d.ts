import { RawSourceMap } from 'source-map'
import { Dictionary } from './lib'
import { SFCBlock } from './parser'

export type BuiltInCompiler = (block?: SFCBlock) => Promise<SFCBlock>

export type CustomCompiler = (block: SFCBlock, builtIn: BuiltInCompiler) => void|SFCBlock|Promise<SFCBlock|void>

export interface ProcessOptions {

  getCompiler?: (block: SFCBlock) => CustomCompiler|false|void

  compilers?: Dictionary<CustomCompiler>
}
