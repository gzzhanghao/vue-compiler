import { RawSourceMap } from 'source-map'
import { Dictionary } from './lib'

export interface ProcessOptions {

  getCompiler?: Function

  compilers?: Dictionary<Function>
}
