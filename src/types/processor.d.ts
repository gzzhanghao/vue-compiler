import { Dictionary } from './lib'
import { RawSourceMap } from 'source-map/source-map'

export interface ProcessOptions {

    getCompiler?: Function

  compilers?: Dictionary<Function>
}
