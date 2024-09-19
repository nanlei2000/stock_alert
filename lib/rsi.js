// @ts-check
const yahooFinance = require('yahoo-finance2').default
const { RSI, MFI } = require('technicalindicators')
const dayjs = require('dayjs')
const { agent } = require('./util')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)
dayjs.extend(timezone)

// 获取最近 30 天的开始和结束日期
function getLast30DaysPeriod() {
  // 获取今天的日期
  const end = dayjs().tz('America/New_York').format('YYYY-MM-DD')

  // 获取 30 天前的日期
  const start = dayjs().tz('America/New_York').subtract(30, 'day').format('YYYY-MM-DD')

  return { start, end }
}

async function getStockRSIAndMFI(stock) {
  try {
    const { start, end } = getLast30DaysPeriod()

    // 使用 chart API 获取股票数据，时间间隔为 1 天
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

    // 提取收盘价、高价、低价、成交量
    const closingPrices = result.quotes.map((v) => v.close)
    const highPrices = result.quotes.map((v) => v.high)
    const lowPrices = result.quotes.map((v) => v.low)
    const volumes = result.quotes.map((v) => v.volume)

    // 检查是否有有效的收盘数据
    if (closingPrices.length === 0) {
      throw new Error('No closing prices found in the data.')
    }

    // 计算 14 天的 RSI
    const rsiValues = RSI.calculate({
      values: closingPrices,
      period: 14,
    })

    // 获取最新的 RSI 值
    const currentRSI = rsiValues[rsiValues.length - 1]

    // 计算 14 天的 MFI
    const mfiValues = MFI.calculate({
      high: highPrices,
      low: lowPrices,
      close: closingPrices,
      volume: volumes,
      period: 14,
    })

    // 获取最新的 MFI 值
    const currentMFI = mfiValues[mfiValues.length - 1]

    console.log(`Latest RSI for ${stock}:`, currentRSI)
    console.log(`Latest MFI for ${stock}:`, currentMFI)

    return {
      stock: stock,
      rsi: currentRSI,
      mfi: currentMFI,
    }
  } catch (error) {
    console.error(`Error fetching stock data for ${stock}:`, error)
    return {
      stock: stock,
      rsi: null,
      mfi: null,
      error: error.message,
    }
  }
}

module.exports = { getStockRSIAndMFI, getLast30DaysPeriod }
