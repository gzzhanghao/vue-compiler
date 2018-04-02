import { Dictionary } from './lib'

export type ModuleDefinition = (module: { exports: Object }, exports: Object) => void

export interface NormalizerRuntime {

  injectStyles: (styles: Array<string>, scopeId: string) => void

  hookModule?: (component: ComponentDescriptor, module: ComponentModuleDescriptor) => void
}

export interface ComponentDescriptor {

  script?: ModuleDefinition

  template?: { render: string, staticRenderFns: Array<string> }

  functional?: boolean

  file?: string

  hasScopedStyles?: boolean

  scopeId?: string

  inlineStyles?: Array<string>

  cssModules?: Dictionary<Dictionary<string>>

  hotAPI?: any

  customBlocks?: Array<ModuleDefinition>
}

export interface ComponentModuleDescriptor {

  hook?: (component: ComponentDescriptor, module: ComponentModuleDescriptor) => void

  exports: any

  options: any
}
