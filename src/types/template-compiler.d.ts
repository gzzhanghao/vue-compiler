import { RawSourceMap } from 'source-map'
import { SFCBlock } from './parser'

export interface CompileTemplateOptions {

  filename?: string

  ssrOptimize?: boolean

  compile?: (template: string, options: Object) => any

  compileOptions?: Object
}

export interface SFCTemplateBlock extends SFCBlock {

  errors?: Array<any>

  tips?: Array<any>

  compileResult?: any

  functional: boolean
}
