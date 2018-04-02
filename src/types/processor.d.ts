import { RawSourceMap } from 'source-map'
import { Dictionary } from './lib'
import { SFCBlock } from './parser'

export type CustomCompiler = (item: SFCBlock) => SFCBlock|void

export interface ProcessOptions {

  getCompiler?: (item: SFCBlock) => CustomCompiler|false|void

  compilers?: Dictionary<CustomCompiler>
}
