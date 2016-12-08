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

Here are some available options:

- compilers
- resolve
- resolver
- babel
- less
- includeFileName
- showDevHints
- extractStyles
- postcss
- cssnano
- styleSourceMap
- sourceMapRoot
- styleLoader
- sourceMap
