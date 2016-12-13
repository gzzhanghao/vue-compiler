# Vue component compiler

Yet another vue component compiler.

__NOTE: Please check out [vue-loader](https://github.com/vuejs/vue-loader) and [vueify](https://github.com/vuejs/vueify) if you'd like to run the compiler with webpack or browserify__

## Installation

```bash
npm i -S @gzzhanghao/vue-component-compiler
```

## Usage

```javascript
import compile from '@gzzhanghao/vue-component-compiler'

const content = `
  <!-- component content -->
`

const options = {
  // compiler options
}

compile('index.vue', content, options).then(res => {
  res.warnings
  res.code
  res.map
  res.extractedStyles
})
```

## Options

```javascript
const options = {

  // Custom compilers for other languages
  compilers: {

    // Compiler for specific language, returns a Promise with transpile result
    // (filePath: string, content: string, options: Object) => Promise
    ts(filePath, content, options) {
      // compile some TypeScript...
      return Promise.resolve({ code, map })
    },
  },

  // Options for the resolver to resolves src requests
  resolver: {
    context: process.cwd(),
    // checkout webpack's configuration/resolve section for more available options
  },

  // Or you can pass in a resolve method directly
  // (dirname: string, request: string) => Promise
  resolve: null,

  // Enable babel, it also accepts an option object
  // When truthy, compiler will compile script tags' content with babel by default
  babel: false,

  // Enables cssnano minifier, also accepts an option object
  cssnano: false,

  // Options for the less compiler
  less: {
    // options...
  },

  // Postcss plugin list
  postcss: [
    // plugins...
  ],

  // Inject the target path into the module as module._fileName
  includeFileName: false,

  // Extract styles from the component, extracted styles are available in the 'extractedStyles' field
  extractStyles: false,

  // Enable sourcemap
  sourceMap: false,

  // Enable sourcemap for styles, sourcemaps will be inlined in the css string if not extracted
  styleSourceMap: false,

  // Source root for sourcemaps
  sourceMapRoot: 'vue:///',

  // Method to load css strings into DOM, it will be invoked as `loadCss('some css')`
  styleLoader: 'loadCss',
}
```
