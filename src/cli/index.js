import Fs from 'fs'
import Mkp from 'mkdirp'
import Chokidar from 'chokidar'
import Minimist from 'minimist'
import Promisify from 'es6-promisify'
import { join, relative, dirname } from 'path'

import Compile from '..'
import Recurse from './Recurse'

const stat = Promisify(Fs.stat)
const mkdirp = Promisify(Mkp)
const readFile = Promisify(Fs.readFile)
const writeFile = Promisify(Fs.writeFile)

const args = Minimist(process.argv.slice(2))

if (args.h || args.help) {
  printUsage()
  process.exit(0)
}

if (args._.length < 2) {
  printUsage()
  process.exit(0)
}

if (args.w || args.watch) {

  Chokidar.watch(args._[0], { ignored })
    .on('add', onChange)
    .on('change', onChange)
    .on('error', onError)

} else {

  Recurse(args._[0], (error, file) => {
    if (error) {
      onError(error)
    } else {
      stat(file).then(stat => {
        if (!ignored(file, stat)) {
          onChange(file)
        }
      }).catch(onError)
    }
  })
}

async function onChange(file) {
  try {

    const relPath = relative(args._[0], file).replace(/\\/g, '/')
    const destPath = join(args._[1], relPath + (args.extension || '.js'))

    const source = await readFile(file, 'utf-8')

    const result = await Compile(relPath, source, {
      resolver: {
        context: args._[0],
      },
      includeFileName: args['include-file-name'],
      showDevHints: args['show-dev-hints'],
      babel: args['babel'],
      less: args['less'],
      cssnano: args['cssnano'],
      styleLoader: args['style-loader'] || 'loadStyle',
      sourceMap: args['source-map'] || args['inline-source-map'],
      styleSourceMap: args['style-source-map'],
    })

    let code = result.code

    if (result.map) {
      code += `//# sourceMappingURL=data:application/json;base64,${new Buffer(result.map.toString()).toString('base64')}`
    }

    await mkdirp(dirname(destPath))
    await writeFile(destPath, code)

    console.log(file, '->', destPath)

  } catch (error) {

    onError(error)
  }
}

function onError(error) {
  console.log(error.stack || error.message || error)
}

function ignored(file, stat) {
  return stat && stat.isFile() && !file.endsWith('.vue')
}

function printUsage() {
  console.log('Usage: vue-compile [src] [dest] [options]')
}
