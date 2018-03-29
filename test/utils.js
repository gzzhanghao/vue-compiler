import fs from 'fs'
import vm from 'vm'
import path from 'path'
import { promisify } from 'es6-promisify'

import compileVue from '../src'

const readFile = promisify(fs.readFile)

export async function compile(filename, options) {
  let filePath = path.resolve(__dirname, filename)

  if (!filePath.endsWith('.vue')) {
    filePath += '.vue'
  }

  const code = await readFile(filePath, 'utf-8')

  return compileVue(filePath, code, options)
}

export async function load(filename, options = {}) {
  const res = await compile(filename, { ...options, runtime: 'v => v' })
  if (res.errors) {
    throw new Error(`Compile error: ${res.errors.join('\n')}`)
  }
  const mod = { exports: {}, hot: 'hotAPI' }
  vm.runInNewContext(res.code, { module: mod, exports: mod.exports, ...options.sandbox }, { filename })
  return mod.exports
}

export function evaluate(factory) {
  const mod = { exports: {} }
  factory(mod, mod.exports)
  return mod.exports
}
