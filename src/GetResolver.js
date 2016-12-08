import Path from 'path'
import Promisify from 'es6-promisify'
import ResolverFactory from 'enhanced-resolve/lib/ResolverFactory'
import NodeJsInputFileSystem from 'enhanced-resolve/lib/NodeJsInputFileSystem'

/**
 * Default resolver options
 */
const defaultResolverOptions = {

  context: process.cwd(),

  fileSystem: new NodeJsInputFileSystem(),
}

/**
 * Get resolve function with options
 *
 * @param {Object} options
 * @return {Function} Resolve function
 */
export default function GetResolver(options_) {
  const options = Object.assign({}, defaultResolverOptions, options_)

  const resolver = ResolverFactory.createResolver(options)
  const resolve = Promisify(resolver.resolve, resolver)

  return function Resolve(path, request) {
    return resolve(options.context, Path.resolve(path), request)
  }
}
