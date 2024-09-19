// @ts-check
const { getMultipleStocksRSI } = require('../index')
const { getLast30DaysPeriod, getStockRSIAndMFI } = require('../lib/rsi')

// getMultipleStocksRSI()

console.log(getStockRSIAndMFI('SPY'))
