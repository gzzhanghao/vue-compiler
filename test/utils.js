import fs from 'fs'
import vm from 'vm'
import path from 'path'
import { promisify } from 'es6-promisify'

import compiler from '../src'

const readFile = promisify(fs.readFile)

/**
 * @param {string} filename
 * @param {Object} options
 * @return {BuildResult}
 */
export async function compile(filename, options) {
  let filePath = path.resolve(__dirname, filename)

  if (!filePath.endsWith('.vue')) {
    filePath += '.vue'
  }

  const code = await readFile(filePath, 'utf-8')

  return compiler(filePath, code, options)
}

/**
 * @param {string} filename
 * @param {Object} options
 * @return {VueComponent}
 */
export async function load(filename, options = {}) {
  const res = await compile(filename, { ...options, normalizer: 'v => v' })
  if (res.errors) {
    throw new Error(`Compile error: ${res.errors.join('\n')}`)
  }
  const mod = { exports: {}, hot: 'hotAPI' }
  vm.runInNewContext(res.code, { module: mod, exports: mod.exports, ...options.sandbox }, { filename })
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
