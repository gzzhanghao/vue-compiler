import { format } from 'prettier'
import { SourceNode } from 'source-map'
import { compile, load } from './utils'

test('compilers option', async () => {
  const script = jest.fn()
  await compile('./fixtures/basic', { processOptions: { compilers: { script } } })

  expect(script).toHaveBeenCalledTimes(1)
})

test('getCompiler method', async () => {
  const compiler = jest.fn()
  await compile('./fixtures/basic', { processOptions: { getCompiler: () => compiler } })

  expect(compiler).toHaveBeenCalledTimes(3)
})

test('compilers accepts block', async () => {
  let blockContent = null

  const component = await load('./fixtures/basic', {
    processOptions: {
      compilers: {
        script(block, builtIn) {
          expect(block).toHaveProperty('type', 'script')
          expect(typeof builtIn).toEqual('function')
          blockContent = block.sourceNode.toString()
        },
      },
    },
  })

  expect(component.script.toString()).toMatch(blockContent)
})

test('custom compilers invoke built in compilers', async () => {
  const component = await compile('./fixtures/basic', {
    processOptions: {
      compilers: {
        async template(block, builtIn) {

          block.sourceNode = new SourceNode(null, null, null, '<div>replaced</div>')

          const templateBlock = await builtIn(block)
          const code = format(templateBlock.sourceNode.toString(), { parser: 'babel', semi: false })

          block.sourceNode = new SourceNode(null, null, null, code.replace(/^\s*;/, ''))

          return block
        },
      },
    },
  })

  expect(component.code).toMatch('replaced')
})
