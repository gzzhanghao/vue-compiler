import defaultsDeep = require('lodash.defaultsdeep')

import { CompileOptions } from './types/compiler'

export const base: CompileOptions = {

  filename: '<anoymous>',

  processOptions: {
    getCompiler: () => {},
    compilers: {},
  },

  styleOptions: {
    postcssPlugins: [],
  },

  assembleOptions: {
    prefix: 'module.exports = require("vue-compiler/lib/normalizer")({})',
  },
}

export const development: CompileOptions = defaultsDeep({}, base, {

  sourceMaps: true,

  sourceRoot: 'vue:///',
})

export const production: CompileOptions = defaultsDeep({}, base, {

})

export const server: CompileOptions = defaultsDeep({}, base, {

  ssrOptimize: true,
})
