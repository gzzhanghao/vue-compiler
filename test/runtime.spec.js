import { load } from './utils'
import { mount } from '@vue/test-utils'
import normalizer from '../src/normalizer'

const injectStyles = () => {}

test('runtime', async () => {
  const injectStyles = jest.fn()

  const component = await load('./fixtures/basic')
  const wrapper = mount(normalizer({ injectStyles })(component))

  expect(wrapper.find('div').text()).toEqual('Lorem ipsum')
  expect(injectStyles).toHaveBeenCalledTimes(1)
})

test('with filename', async () => {
  const component = await load('./fixtures/basic', { assembleOptions: { includeFileName: true } })
  const exports = normalizer({ injectStyles })(component)

  expect(exports.__file).toMatch('basic')
})

test('css modules / scope', async () => {
  const component = await load('./fixtures/styles')
  const wrapper = mount(normalizer({ injectStyles })(component))

  const attrs = wrapper.find('div').attributes()
  const cssModules = component.cssModules

  expect(attrs).toHaveProperty(component.scopeId)
  expect(attrs.class).toEqual(`scoped ${cssModules.$style.module} ${cssModules.custom.custom}`)
})

test('functional component', async () => {
  const injectStyles = jest.fn()

  const component = await load('./fixtures/functional')

  mount(normalizer({ injectStyles })(component))

  expect(injectStyles).toHaveBeenCalledTimes(1)
})

test('custom-blocks', async () => {
  const component = await load('./fixtures/customblock')
  const exports = normalizer({ injectStyles })(component)

  expect(exports.foo).toEqual('bar')
})
