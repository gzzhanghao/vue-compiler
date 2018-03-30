import { RawSourceMap } from "source-map/source-map"
import { SFCBlock } from "./parser"

export interface CompileTemplateOptions {

  filename?: string

  ssrOptimize?: boolean

  compileOptions?: Object
}

export interface SFCTemplateBlock extends SFCBlock {

  functional: boolean

  tips?: Array<string>

  errors?: Array<string>
}
