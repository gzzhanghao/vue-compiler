import { load } from './utils'

test('baseline', async () => {
  console.log(await load('./fixtures/basic'))
})
