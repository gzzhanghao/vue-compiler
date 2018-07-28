import { SFCBlock } from './types/parser'
import { ProcessOptions, BuiltInCompiler } from './types/processor'

export async function proc(item: SFCBlock, options: ProcessOptions, builtIn?: BuiltInCompiler): Promise<SFCBlock> {
  let compile = await options.getCompiler(item)

  if (!compile && compile !== false) {
    compile = resolveCompiler(item, options)
  }

  if (!compile) {
    return builtInProxy(item)
  }

  const result = await compile(item, builtInProxy)

  return result || item

  async function builtInProxy(replace: SFCBlock = item) {
    if (!builtIn) {
      return replace
    }
    return builtIn(replace)
  }
}

export function procSync(item: SFCBlock, options: ProcessOptions, builtIn?: BuiltInCompiler): SFCBlock {
  let compile = options.getCompiler(item)

  if (!compile && compile !== false) {
    compile = resolveCompiler(item, options)
  }

  if (typeof compile !== 'function') {
    return builtInProxy(item) as SFCBlock
  }

  const result = compile(item, builtInProxy) as SFCBlock

  return result || item

  function builtInProxy(replace: SFCBlock = item) {
    if (!builtIn) {
      return replace
    }
    return builtIn(replace)
  }
}

function resolveCompiler(item: SFCBlock, options: ProcessOptions) {
  return options.compilers[item.attrs.lang as string] || options.compilers[item.type]
}
