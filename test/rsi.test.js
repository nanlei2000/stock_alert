// @ts-check
const { getStockRSI } = require('../lib/rsi')

getStockRSI('NVDA').then((res) => console.log(res))
