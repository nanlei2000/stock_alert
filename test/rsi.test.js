const { getStockRSI } = require('../lib/rsi')

test('getStockRSI', async () => {
  const res = await getStockRSI('NVDA')
  console.log('res', res)
})
