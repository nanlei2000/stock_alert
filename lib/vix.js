// @ts-check
const { getLastNDaysPeriod, agent } = require('./util')
const yahooFinance = require('yahoo-finance2').default
const SMA = require('technicalindicators').SMA

async function getVIXInfo() {
  try {
    const { start, end } = getLastNDaysPeriod(250)
    // 使用 chart API 获取 AAPL 的数据，时间间隔为 1 天
    const result = await yahooFinance.chart(
      '^VIX',
      {
        period1: start,
        period2: end,
        interval: '1d',
      },
      {
        fetchOptions: {
          agent,
        },
      }
    )

    // 提取收盘价
    const closingPrices = []
    for (const quote of result.quotes) {
      if (quote.close) {
        closingPrices.push(quote.close)
      }
    }

    // 检查是否有有效的收盘数据
    if (closingPrices.length === 0) {
      throw new Error('No closing prices found in the data.')
    }

    const price = closingPrices[closingPrices.length - 1]
    const ma20List = SMA.calculate({
      period: 20,
      values: closingPrices,
    })
    const ma20 = ma20List[ma20List.length - 1]

    return {
      price,
      ma20,
    }
  } catch (error) {
    console.error(`Error fetching stock data for ^VIX:`, error)
    return null
  }
}

module.exports = { getVIXInfo }
