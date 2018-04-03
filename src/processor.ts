import { SFCBlock } from './types/parser'
import { ProcessOptions, BuiltInCompiler } from './types/processor'

export default async function proc(item: SFCBlock, options: ProcessOptions, builtIn?: BuiltInCompiler): Promise<SFCBlock> {
  let compile = await options.getCompiler(item)

  if (!compile && compile !== false) {
    compile = options.compilers[(<string>item.attrs.lang)] || options.compilers[item.type]
  }

  if (!compile) {
    return builtInProxy(item)
  }

  return (await compile(item, builtInProxy)) || item

  async function builtInProxy(replace: SFCBlock = item) {
    if (!builtIn) {
      return replace
    }
    return builtIn(replace)
  }
}
