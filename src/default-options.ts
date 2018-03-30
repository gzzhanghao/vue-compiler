import defaultsDeep from 'lodash.defaultsdeep'
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
    normalizer: 'function(v) { return v }',
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
