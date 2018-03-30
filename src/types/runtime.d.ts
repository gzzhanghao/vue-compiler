import { Dictionary } from "./lib"

export interface NormalizerRuntime {

  injectStyles: (styles: Array<string>, scopeId: string) => void

  hookModule: (component: VueComponentDescriptor, module: ComponentModuleDescriptor) => void
}

export interface VueComponentDescriptor {

  script?: Function

  template?: { render: string, staticRenderFns: Array<string> }

  functional?: boolean

  file?: string

  hasScopedStyles?: boolean

  scopeId?: string

  inlineStyles?: Array<string>

  cssModules?: Dictionary<Dictionary<string>>

  hotAPI?: any

  customBlocks?: Array<Function>
}

export interface ComponentModuleDescriptor {

  hook?: Function

  exports: any

  options: any
}
