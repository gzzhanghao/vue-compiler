# vue-compiler

For those who can't use webpack in their project.

## Basic Usage

```javascript
import compile from 'vue-compiler'

const { code, map } = await compile(source)

// :tada:
```

## Table of Contents

- [vue-compiler](#vue-compiler)
  - [Basic Usage](#basic-usage)
  - [Table of Contents](#table-of-contents)
  - [API](#api)
    - [compile(source: string, options: CompileOptions): Promise&lt;CompileResult&gt;](#compilesource-string-options-compileoptions-promisecompileresult)
    - [compileSync(source: string, options: CompileOptions): CompileResult](#compilesource-string-options-compileoptions-promisecompileresult)
    - [parse(source: string, options: ParseOptions): SFCDescriptor](#parsesource-string-options-parseoptions-sfcdescriptor)
    - [compileTemplate(block: SFCBlock, options: CompileTemplateOptions): SFCTemplateBlock](#compiletemplateblock-sfcblock-options-compiletemplateoptions-sfctemplateblock)
    - [compileStyle(block: SFCBlock, options: CompileStyleOptions): Promise&lt;SFCStyleBlock&gt;](#compilestyleblock-sfcblock-options-compilestyleoptions-promisesfcstyleblock)
    - [assemble(components: AssembleInput, options: AssembleOptions): AssembleResult](#assemblecomponents-assembleinput-options-assembleoptions-assembleresult)
    - [normalize(runtime: NormalizerRuntime): (component: ComponentDescriptor) => any](#normalizeruntime-normalizerruntime-component-componentdescriptor--any)

## API

### compile(source: string, options: CompileOptions): Promise&lt;CompileResult&gt;

Compile SFC source code to a single cmd module.

```typescript
interface CompileOptions {

  mode?: 'development' | 'production' | 'server' // default: 'production'
  // compile mode, used to determin default options

  filename?: string // default: '<anoymous>'
  // file name that will be used in sourcemaps and `vm.__file` field

  scopeId?: string // defaulat: hash(filename)
  // scopeId for scoped css and hmr

  parseOptions?: ParseOptions
  // options for `parse`

  templateOptions?: CompileTemplateOptions
  // options for `compileTemplate`

  styleOptions?: CompileStyleOptions
  // options for `compileStyle`

  assembleOptions?: AssembleOptions
  // options for `assemble`

  processOptions?: ProcessOptions
  // options for processing blocks

  sourceMaps?: boolean
  // enable sourcemaps

  sourceRoot?: string
  // source root for the sourcemap

  ssrOptimize?: boolean
  // generate SSR optimized code
}

interface CompileResult extends AssembleResult {

  errors?: Array<any>
  // error from `vue-template-compiler`

  tips?: Array<any>
  // error from `vue-template-compiler`

  scopeId: string
  // component's scopeId

  functional?: boolean
  // whether the component is functional
}

interface ProcessOptions {
  // custom compilers will run before built-in compilers

  getCompiler?: (block: SFCBlock) => CustomCompiler|false|void
  // get compiler for a specific block
  //
  // when return false, processor will NOT try to get compilers
  // from ProcessOptions.compilers

  compilers?: { [key: string]: CustomCompiler }
  // compilers for specific blocks and langs
}

type BuiltInCompiler = (block?: SFCBlock) => Promise<SFCBlock>
// built in compiler that returns a SFCStyleBlock or SFCTemplateBlock

type CustomCompiler = (block: SFCBlock, builtIn: BuiltInCompiler) => void|SFCBlock|Promise<void|SFCBlock>
// custom compiler that replaces block's properties or
// returns a new block to replace the origin block
```

### parse(source: string, options: ParseOptions): SFCDescriptor

Parse SFC source into a descriptor.

```typescript
interface ParseOptions {

  parseOptions?: Object
  // options passed to `VueTemplateCompiler.parseComponent`

  filename?: string // default: CompileOptions.filename
  // file name in SFCBlock

  sourceMaps?: boolean // default: CompileOptions.sourceMaps
  // enable sourcemap

  sourceRoot?: string // default: CompileOptions.sourceRoot
  // source root for the sourcemap
}

interface SFCDescriptor {

  script?: SFCBlock
  // script block

  template?: SFCBlock
  // template block

  styles: Array<SFCBlock>
  // style blocks

  customBlocks: Array<SFCBlock>
  // custom blocks
}

interface SFCBlock {

  type: string
  // block type

  src?: string
  // block's src attribute

  attrs: { [key: string]: string|boolean }
  // block's attributes

  sourceNode: SourceNode
  // source node for block's content
  // will be `require("${src}")` if src attribute is present

  index?: number
  // index of the block for style and custom blocks

  loc: { start: Loc, end: Loc }
  // location info
}

interface Loc {

  index: number
  // location index

  line: number
  // zero-based line number

  column: number
  // zero-based column number
}

```

### compileTemplate(block: SFCBlock, options: CompileTemplateOptions): SFCTemplateBlock

Takes a block comes from `parse` method and transform it into a template block.

The `sourceNode` of the origin block will be compiled with `vue-template-compiler`, and additional info will be added to the block.

```typescript
interface CompileTemplateOptions {

  filename?: string // default: CompileOptions.filename
  // file name for the result source node

  ssrOptimize?: boolean // default: CompileOptions.ssrOptimize
  // generate SSR optimized code

  compile?: (template: string, options: Object) => any // default: VueTemplateCompiler.compile
  // custom compile function

  compileOptions?: Object
  // compile options passed to `VueTemplateCompiler.compile`
}

interface SFCTemplateBlock extends SFCBlock {

  errors?: Array<any>
  // error from `vue-template-compiler`

  tips?: Array<any>
  // error from `vue-template-compiler`

  compileResult?: any
  // result from compile method

  functional: boolean
  // whether the template is functional
}
```

### compileStyle(block: SFCBlock, options: CompileStyleOptions): Promise&lt;SFCStyleBlock&gt;

Takes a block comes from `parse` method and transform it into a style block.

The `sourceNode` of the origin block will be compiled with `scoped-id` and `postcss-modules` plugin, and additional info will be added to the block.

```typescript
interface CompileStyleOptions {

  scopeId?: string
  // scopeId for scoped css

  postcssPlugins?: Array<any>
  // additional postcss plugins

  postcssModules?: Object
  // options for `postcss-modules`

  filename?: string // default: CompileOptions.filename
  // file name in SFCBlock

  sourceMaps?: boolean // default: CompileOptions.sourceMaps
  // enable sourcemap

  sourceRoot?: string // default: CompileOptions.sourceRoot
  // source root for the sourcemap
}

interface SFCStyleBlock extends SFCBlock {

  scoped: boolean
  // whether the style block is scoped

  cssModules?: { name: string, mapping: { [key: string]: string } }
  // css modules info when `module` attribute is present
}
```

### assemble(components: AssembleInput, options: AssembleOptions): AssembleResult

Assemble blocks into a code block that evaluates to a `ComponentDescriptor`.

```typescript
interface AssembleInput {

  script: SFCBlock
  // script block

  template: SFCTemplateBlock
  // template block from `compileTemplate`

  styles: Array<SFCStyleBlock>
  // style blocks from `compileStyles`

  customBlocks: Array<SFCBlock>
  // custom blocks
}

interface AssembleOptions {

  filename?: string // default: CompileOptions.filename
  // file name in SFCBlock

  sourceMaps?: boolean // default: CompileOptions.sourceMaps
  // enable sourcemap

  sourceRoot?: string // default: CompileOptions.sourceRoot
  // source root for the sourcemap

  styleSourceMaps?: boolean // default: AssembleOptions.sourceMaps
  // emit sourcemaps for styles

  scopeId?: string
  // component's scopeId

  prefix?: SourceNode|string
  // prepend to generated code, useful for specifying module normalizer
  // defulat: 'module.exports = require("vue-compiler/lib/normalizer").default({})'
  // eg: 'return ' -> return { /* component descriptor */ }
  // eg: 'define(' -> define({ /* component descriptor */ })

  postfix?: SourceNode|string
  // append to generated code

  extractStyles?: boolean
  // extract styles

  ssrOptimize?: boolean
  // generate SSR optimized code

  hotAPI?: string
  // enable hmr and specify hot reload API
  // eg: 'module.hot'

  includeFileName?: boolean
  // set `vm.__file` to AssembleOptions.filename
}

interface AssembleResult {

  code: string
  // result code

  map?: SourceMapGenerator
  // result sourcemap

  extractedStyles?: Array<{ code: string, map?: SourceMapGenerator }>
  // extracted styles
}

interface ComponentDescriptor {

  script?: ModuleDefinition
  // module definition for script block

  template?: { render: string, staticRenderFns: Array<string> }
  // render functions for template block

  functional?: boolean
  // whether the component is functional

  file?: string
  // filename from AssembleOptions

  hasScopedStyles?: boolean
  // whether the component has scoped styles
  // when falsy, `scopeId` should not be added to the component options

  scopeId?: string
  // scopeId of the component, used for scoped css and hmr

  inlineStyles?: Array<string>
  // list of inline styles
  // sourcemaps will be inlined if `styleSourceMaps` is truthy

  cssModules?: Dictionary<Dictionary<string>>
  // css modules info

  hotAPI?: any
  // hot module API evaluates from AssembleOptions.hotAPI

  customBlocks?: Array<ModuleDefinition>
  // module definitions for custom blocks
}

type ModuleDefinition = (module: { exports: Object }, exports: Object) => void
```

### normalize(runtime: NormalizerRuntime): (component: ComponentDescriptor) => any

```typescript
interface NormalizerRuntime {

  injectStyles: (styles: Array<string>, scopeId: string) => void
  // method to inject styles to document

  hookModule?: (component: ComponentDescriptor, module: ComponentModuleDescriptor) => void
  // method to hook hmr API with component
}

interface ComponentModuleDescriptor {

  hook?: Function
  // called in `beforeCreate` life-cycle hook
  // if the component is functional, it'll be called in `render` method

  exports: any
  // module.exports from script block

  options: any
  // vue options from script block
}
```
