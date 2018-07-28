import { RawSourceMap } from 'source-map'
import { Dictionary } from './lib'
import { SFCBlock } from './parser'

export type BuiltInCompiler = (block?: SFCBlock) => SFCBlock | Promise<SFCBlock>

export type CustomCompiler = (block: SFCBlock, builtIn: BuiltInCompiler) => void | SFCBlock | Promise<SFCBlock | void>

export type GetCompilerResult = void | false | CustomCompiler

export interface ProcessOptions {

  getCompiler?: (block: SFCBlock) => GetCompilerResult | Promise<GetCompilerResult>

  compilers?: Dictionary<CustomCompiler>
}
