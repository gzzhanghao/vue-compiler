import { SourceNode } from 'source-map'
import * as VueCompiler from 'vue-template-compiler'

/**
 * Compile file into component
 *
 * @param {string}          filePath
 * @param {string}          content
 * @param {CompilerOptions} options
 * @return {BuildResult | ErrorResult} Compile result
 */
export default function parse(filePath, content, options) {
  const components = VueCompiler.parseComponent(content)

  if (components.script) {
    setSourceInfo(components.script, filePath, content)
  }

  if (components.template) {
    setSourceInfo(components.template, filePath, content)
  }

  for (let i = 0, ii = components.styles.length; i < ii; i++) {
    components.styles[i].index = i
    setSourceInfo(components.styles[i], filePath, content)
  }

  for (let i = 0, ii = components.customBlocks.length; i < ii; i++) {
    components.customBlocks[i].index = i
    setSourceInfo(components.customBlocks[i], filePath, content)
  }

  return components
}

/**
 * Set source information for block
 *
 * @param {SFCBlock} item
 * @param {string}   filePath
 * @param {string}   content
 */
function setSourceInfo(item, filePath, content) {
  const lines = item.content.split('\n')

  item.warnings = []

  item.line = content.slice(0, item.start).split(/\r?\n/g).length

  item.sourceContent = content
  item.content = Array(item.line).join('\n') + item.content

  item.filePath = `${filePath}?${item.type}`
  if (item.index != null) {
    item.filePath += `_${item.index}`
  }

  if (item.attrs.src) {
    item.node = new SourceNode(
      item.line || 1,
      item.column,
      item.filePath,
      `require(${JSON.stringify(item.attrs.src)})`
    )
    return
  }

  item.node = new SourceNode(null, null, filePath, lines.map((content, line) => {
    let lineEnding = ''

    if (line + 1 < lines.length) {
      lineEnding = '\n'
    }

    return new SourceNode(
      (item.line || 1) + line,
      line ? 0 : item.column,
      filePath,
      content + lineEnding
    )
  }))
}
