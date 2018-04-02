import { SourceMapGenerator } from 'source-map'

import { AssembleOptions, AssembleResult } from './assembler'
import { CompileStyleOptions } from './style-compiler'
import { CompileTemplateOptions } from './template-compiler'
import { ParseOptions } from './parser'
import { ProcessOptions } from './processor'

export interface CompileOptions {

  mode?: 'development' | 'production' | 'server'

  filename?: string

  scopeId?: string

  parseOptions?: ParseOptions

  processOptions?: ProcessOptions

  templateOptions?: CompileTemplateOptions

  styleOptions?: CompileStyleOptions

  assembleOptions?: AssembleOptions

  sourceMaps?: boolean

  sourceRoot?: string

  ssrOptimize?: boolean
}

export interface CompileResult extends AssembleResult {

  errors?: Array<string>

  tips?: Array<string>

  scopeId: string

  functional?: boolean
}
