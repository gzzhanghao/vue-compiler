import Fs from 'fs'
import { join } from 'path'
import Promisify from 'es6-promisify'

const stat = Promisify(Fs.stat)
const readdir = Promisify(Fs.readdir)

/**
 * Walk directory recursively
 *
 * @param {string}   base
 * @param {Function} cb
 * @return {Promise}
 */
export default async function Recurse(base, cb) {
  if (Array.isArray(base)) {
    return Promise.all(base.map(file => Recurse(file, cb)))
  }

  try {
    const stats = await stat(base)

    if (!stats.isDirectory()) {
      return cb(null, base, stats)
    }

    const files = await readdir(base)

    if (files.length) {
      Recurse(files.map(file => join(base, file)), cb)
    }

  } catch (error) {

    cb(error)
  }
}
