import fs = require('fs')
import vm = require('vm')
import path = require('path')
import defaultsDeep = require('lodash.defaultsdeep')

const { promisify } = require('es6-promisify')

import * as compiler from '../src'
import { CompileOptions, CompileResult } from '../src/types/compiler'

export interface LoadOptions extends CompileOptions {

  sandbox?: Object
}

const readFile = promisify(fs.readFile)

export async function compile(filePath: string, options: CompileOptions = {}): Promise<CompileResult> {
  return compiler.compile(await readComponent(filePath), options)
}

export async function compileSync(filePath: string, options: CompileOptions = {}): Promise<CompileResult> {
  return compiler.compileSync(await readComponent(filePath), options)
}

export async function load(filename: string, options: LoadOptions = {}): Promise<any> {
  const res = await compile(filename, defaultsDeep({}, options, {
    assembleOptions: { prefix: 'module.exports = ' },
  }))
  const mod = { exports: {}, hot: 'hotAPI' }
  vm.runInNewContext(res.code, { module: mod, exports: mod.exports, ...options.sandbox }, { filename })
  return mod.exports
}

export function evaluate(factory: Function): any {
  const mod = { exports: {} }
  factory(mod, mod.exports)
  return mod.exports
}

function readComponent(filePath: string) {
  let filename = path.resolve(__dirname, filePath)

  if (!filename.endsWith('.vue')) {
    filename += '.vue'
  }

  return readFile(filename, 'utf-8')
}
