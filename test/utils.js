import fs from 'fs'
import vm from 'vm'
import path from 'path'
import { promisify } from 'es6-promisify'

import compiler from '../src'

const readFile = promisify(fs.readFile)

/**
 * @param {string} filePath
 * @param {Object} options
 * @return {BuildResult}
 */
export async function compile(filePath, options) {
  let filename = path.resolve(__dirname, filePath)

  if (!filename.endsWith('.vue')) {
    filename += '.vue'
  }

  const code = await readFile(filename, 'utf-8')

  return compiler(code, { ...options, filename })
}

/**
 * @param {string} filePath
 * @param {Object} options
 * @return {VueComponent}
 */
export async function load(filePath, options = {}) {
  const res = await compile(filePath, { ...options, normalizer: 'v => v' })
  if (res.errors) {
    throw new Error(`Compile error: ${res.errors.join('\n')}`)
  }
  const mod = { exports: {}, hot: 'hotAPI' }
  vm.runInNewContext(res.code, { module: mod, exports: mod.exports, ...options.sandbox }, { filename: filePath })
  return mod.exports
}

/**
 * @param {Function} factory
 * @return {any}
 */
export function evaluate(factory) {
  const mod = { exports: {} }
  factory(mod, mod.exports)
  return mod.exports
}
