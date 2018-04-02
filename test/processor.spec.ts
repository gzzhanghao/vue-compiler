import { compile } from './utils'

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
