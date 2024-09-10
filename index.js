const yahooFinance = require('yahoo-finance2').default
const { RSI } = require('technicalindicators')

async function getStockData() {
  try {
    // 使用 chart API 获取 AAPL 的数据，时间间隔为 1 天
    const result = await yahooFinance.chart('SPY', {
      period1: '2024-01-01',
      period2: '2024-09-10',
      interval: '1d'
    })

    // 提取收盘价
    const closingPrices = result.quotes.map((v) => v.close)

    // 检查是否有有效的收盘数据
    if (closingPrices.length === 0) {
      throw new Error('No closing prices found in the data.')
    }

    // 计算 14 天的 RSI
    const rsiValues = RSI.calculate({ values: closingPrices, period: 14 })

    // 获取最新的 RSI 值
    const currentRSI = rsiValues[rsiValues.length - 1]
    console.log('Latest RSI:', currentRSI)

    // 如果 RSI 小于 30，打印 1
    if (currentRSI < 30) {
      console.log(1)
    }
  } catch (error) {
    console.error('Error fetching stock data:', error)
  }
}

getStockData()
