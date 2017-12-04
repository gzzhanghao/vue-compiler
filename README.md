# Vue compiler

A standalone vue component compiler.

__NOTE: Please check out [vue-loader](https://github.com/vuejs/vue-loader) and [vueify](https://github.com/vuejs/vueify) if you'd like to run the compiler with webpack or browserify__

## Usage

```javascript
const compile = require('vue-compiler').default

const filePath = 'index.vue'

const content = `
  <template>
    <div> component contents </div>
  </template>
`

const options = {
  // compiler options
}

compile(filePath, content, options).then(res => {
  if (res.errors) {
    console.log(res.errors)
    return
  }
  console.log(res.code)
  // commonjs module code
})
```

## API

```typescript
type CompilerOptions = {

  includeFileName?: boolean // false
  // inject file path as module.__file

  compilerOptions?: Vue.CompilerOptions // null
  // options for vue template compiler

  extractStyles?: boolean // false
  // extract styles from the component
  // extracted styles are available in 'styles' field

  styleLoader?: string // "loadCss"
  // method to load css strings if not extracted
  // styles will be loaded with `${styleLoader}(${cssString}, ${scopeId})`

  postcss?: Array<PostCSSPlugin> // []
  // PostCSS plugin list

  postcssModules?: Object // null
  // options for PostCSS modules

  sourceMap?: boolean // false
  // enable sourcemap

  styleSourceMap?: boolean // false
  // enable sourcemap for styles
  // style's sourcemap will be inlined in the css string if not extracted

  sourceMapRoot?: string // "vue:///"
  // source root

  getCompiler?: CustomCompilerGetter // noop
  // get compiler for a block
  // return false to prevent resolving compiler from options.compilers

  compilers?: {
    // custom compilers for other languages

    [key: string]: CustomCompiler
    // keys will be matched to block's lang attribute and type
  }

  hotReload?: { // false
    // hot reload options

    hotAPI?: string // 'require("vue-hot-reload-api")'
    // reference to vue hot reload api

    vueModule?: string // 'require("vue")'
    // reference to vue module
  }
}

type BuildResult = CodeResult & {

  warnings: Array<WarningMessage>
  // compiler warnings

  scopeId?: string
  // component scope id

  styles?: Array<CodeResult>
  // extracted styles
}

type CodeResult = {
  code: string
  map?: SourceMapGenerator
}

type ErrorResult = {

  errors?: Array<WarningMessage>
  // vue parser errors
}

interface Compiler {

  default(filePath: string, content: string, options?: CompilerOptions): Promise<BuildResult | ErrorResult>
}

type WarningMessage = {
  msg: string
  start?: number
  end?: number
}

type CustomCompilerGetter = (item: BlockItem, options: CompilerOptions)?: Promise<CustomCompiler | false>

type CustomCompiler = (item: BlockItem, options: Object): Promise<CodeResult & { warnings }>

type BlockItem = SFCBlock & {

  warnings: Array<WarningMessage>
  // warnings comes from custom compilers

  line: number
  // zero-based line number that block begins

  sourceContent: string
  // origin block content

  content: string
  // line-padded block content

  index?: number
  // exists if the block is a style block or a custom block

  filePath: string
  // file path passed to the compiler

  node: SourceNode
  // source node generated from filePath and content
}
```
