import { SourceNode, SourceMapConsumer } from 'source-map'

/**
 * Process the SFCBlock according to its language
 *
 * @param {SFCBlock}        item    The SFCBlock to be compiled
 * @param {CompilerOptions} options
 */
export default async function processItem(item, options) {
  let compile = await options.getCompiler(item, options)

  if (!compile && compile !== false) {
    compile = options.compilers[item.lang] || options.compilers[item.type]
  }

  if (!compile) {
    return
  }

  const result = await compile(item, options)

  if (!result) {
    return
  }

  item.warnings = result.warnings || []

  if (!options.sourceMap || !result.map) {
    item.node = new SourceNode(null, null, item.filePath, result.code)
  } else {
    item.node = SourceNode.fromStringWithSourceMap(result.code, new SourceMapConsumer(result.map))
  }

  item.node.setSourceContent(item.filePath, item.sourceContent)
}
