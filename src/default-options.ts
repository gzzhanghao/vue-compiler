import defaultsDeep = require('lodash.defaultsdeep')

import { CompileOptions } from './types/compiler'

export const base: CompileOptions = {

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

export const development = defaultsDeep({}, base, {

  sourceMaps: true,

  sourceRoot: 'vue:///',
})

export const production = defaultsDeep({}, base, {

})

export const server = defaultsDeep({}, base, {

  ssrOptimize: true,
})
