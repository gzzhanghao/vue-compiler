import {
  compile,
  load,
  evaluate,
} from './utils'

test('basic compiler', async () => {
  const component = await compile('./fixtures/basic', { sourceMaps: true })

  expect(component).toHaveProperty('code')
  expect(component).toHaveProperty('map')
  expect(component).toHaveProperty('scopeId')

  expect(component.tips).toBeFalsy()
  expect(component.errors).toBeFalsy()
  expect(component.functional).toBeFalsy()
})

test('report errors', async () => {
  const component = await compile('./fixtures/invalid')

  expect(component.errors).toHaveLength(1)
})

test('report tips', async () => {
  const component = await compile('./fixtures/tips')

  expect(component.tips).toHaveLength(1)
})

test('complex template', async () => {
  const component = await load('./fixtures/complex')

  expect(component.template.staticRenderFns).toHaveLength(1)
})

test('extract styles', async () => {
  const component = await compile('./fixtures/styles', { assembleOptions: { extractStyles: true } })
  const styles = component.extractedStyles

  expect(styles).toHaveLength(3)
  expect(styles[0]).toHaveProperty('code')
  expect(styles[0].code).toMatch('.scoped')
})

test('css modules / scope', async () => {
  const component = await load('./fixtures/styles')

  expect(component.hasScopedStyles).toBeTruthy()
  expect(component.cssModules).toMatchObject({ $style: {}, custom: {} })

  const styles = component.inlineStyles

  expect(styles).toHaveLength(1)

  expect(styles[0]).toMatch(component.scopeId)
  expect(styles[0]).toMatch(component.cssModules.$style.module)
  expect(styles[0]).toMatch(component.cssModules.custom.custom)
})

test('style sourcemaps', async () => {
  const component = await load('./fixtures/styles', { sourceMaps: true })

  expect(component.inlineStyles[0]).toMatch('sourceMappingURL')
})

test('extract style sourcemaps', async () => {
  const component = await compile('./fixtures/styles', { sourceMaps: true, assembleOptions: { extractStyles: true } })

  expect(component.extractedStyles[0]).toHaveProperty('map')
})

test('custom blocks', async () => {
  const component = await load('./fixtures/customblock')

  expect(component.customBlocks).toHaveLength(1)
  expect(typeof evaluate(component.customBlocks[0])).toEqual('function')
})

test('external blocks', async () => {
  const require = (v: string): any => v
  const component = await load('./fixtures/external', { sandbox: { require } })

  expect(component.template).toEqual('template')

  expect(component.inlineStyles).toHaveLength(2)
  expect(component.inlineStyles[0]).toEqual('style.0')
  expect(component.inlineStyles[1]).toEqual('style.1')

  expect(evaluate(component.script)).toEqual('script')

  expect(component.customBlocks).toHaveLength(1)
  expect(evaluate(component.customBlocks[0])).toEqual('custom-block')
})

test('functional component', async () => {
  const component = await load('./fixtures/functional')

  expect(component.functional).toBeTruthy()
  expect(component.template.render).toHaveLength(2)
})

test('hot reload', async () => {
  const component = await load('./fixtures/basic', { assembleOptions: { hotAPI: 'module.hot' } })

  expect(component.hotAPI).toEqual('hotAPI')
})

test('include file name', async () => {
  const component = await load('./fixtures/basic', { assembleOptions: { includeFileName: true } })

  expect(component.file).toMatch('basic')
})

test('server rendering', async () => {
  const component = await load('./fixtures/basic', { ssrOptimize: true })

  expect(component.server).toBeTruthy()
})
