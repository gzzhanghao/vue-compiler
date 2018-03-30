import { SFCBlock } from './types/parser'
import { ProcessOptions } from './types/processor'

export default async function proc(item: SFCBlock, options: ProcessOptions): Promise<SFCBlock> {
  let compile = await options.getCompiler(item, options)

  if (!compile && compile !== false) {
    compile = options.compilers[<string>item.attrs.lang] || options.compilers[item.type]
  }

  if (!compile) {
    return item
  }

  return compile(item) || item
}
