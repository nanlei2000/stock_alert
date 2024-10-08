// @ts-check
const yahooFinance = require('yahoo-finance2').default
const { RSI } = require('technicalindicators')
const { agent, getLastNDaysPeriod } = require('./util')

async function getStockRSI(stock) {
  try {
    const { start, end } = getLastNDaysPeriod(500)
    // 使用 chart API 获取 AAPL 的数据，时间间隔为 1 天
    const result = await yahooFinance.chart(
      stock,
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

    // 计算 14 天的 RSI
    const rsiValues = RSI.calculate({ values: closingPrices, period: 14 })

    // 获取最新的 RSI 值
    const currentRSI = rsiValues[rsiValues.length - 1]
    console.log(`Latest RSI for ${stock}:`, currentRSI)

    return {
      stock: stock,
      rsi: currentRSI,
    }
  } catch (error) {
    console.error(`Error fetching stock data for ${stock}:`, error)
    return {
      stock: stock,
      rsi: null,
      error: error.message,
    }
  }
}

module.exports = { getStockRSI }
