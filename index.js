// @ts-check
const yahooFinance = require('yahoo-finance2').default
const { RSI } = require('technicalindicators')
const nodemailer = require('nodemailer')
const cron = require('node-cron')
const fs = require('fs')
const dayjs = require('dayjs')
const { getFearGreedIndex } = require('./fear_greed')
const HttpsProxyAgent = require('https-proxy-agent').HttpsProxyAgent

// 设置代理地址，例如：'http://username:password@proxyserver.com:8080'
// clash
const proxy = 'http://127.0.0.1:7890'

// 创建一个代理实例
const agent = new HttpsProxyAgent(proxy)

// 读取配置文件
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'))

// SMTP 邮件发送配置，从配置文件读取
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.auth.user,
    pass: config.smtp.auth.pass,
  },
})

// 获取最近 30 天的开始和结束日期
function getLast30DaysPeriod() {
  // 获取今天的日期
  const end = dayjs().format('YYYY-MM-DD')

  // 获取 30 天前的日期
  const start = dayjs().subtract(30, 'day').format('YYYY-MM-DD')

  return { start, end }
}

async function getStockRSI(stock) {
  try {
    const { start, end } = getLast30DaysPeriod()
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
    const closingPrices = result.quotes.map((v) => v.close)

    // 检查是否有有效的收盘数据
    if (closingPrices.length === 0) {
      throw new Error('No closing prices found in the data.')
    }

    // 计算 14 天的 RSI
    // @ts-expect-error
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

// 发送邮件函数
async function sendEmail(stockRSIReports) {
  const mailOptions = {
    from: config.email.from,
    to: config.email.to,
    subject: 'Stock Alert: RSI Notification',
    text: stockRSIReports.join('\n'), // 汇总每个股票的 RSI 信息
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('Email sent successfully.')
  } catch (error) {
    console.error('Error sending email:', error)
  }
}

// 获取多个股票的 RSI 并发送邮件
async function getMultipleStocksRSI() {
  const stockRSIReports = []

  // 遍历配置文件中列出的每个股票
  for (const stock of config.stocks) {
    const stockRSI = await getStockRSI(stock)

    if (stockRSI.rsi !== null) {
      // 检查 RSI 是否小于 30
      if (stockRSI.rsi < 32) {
        stockRSIReports.push(
          `RSI for ${stockRSI.stock} is below 30. Current RSI: ${stockRSI.rsi}. Consider buying.`
        )
      } else if (stockRSI.rsi > 68) {
        stockRSIReports.push(
          `RSI for ${stockRSI.stock} is above 70. Current RSI: ${stockRSI.rsi}. Consider selling.`
        )
      } else {
        stockRSIReports.push(`RSI for ${stockRSI.stock} is ${stockRSI.rsi}.`)
      }
    } else {
      stockRSIReports.push(
        `Failed to retrieve data for ${stockRSI.stock}: ${stockRSI.error}`
      )
    }
  }

  // 获取 CNN Fear & Greed Index
  const fearGreedIndex = await getFearGreedIndex()

  // 如果指数为 "Fear" 或 "Extreme Fear"，添加到报告中
  if (
    fearGreedIndex &&
    (fearGreedIndex.rating.toLowerCase() === 'fear' ||
      fearGreedIndex.rating.toLowerCase() === 'extreme fear')
  ) {
    stockRSIReports.push(
      `CNN Fear & Greed Index is in ${fearGreedIndex.rating} state (Score: ${fearGreedIndex.score}).`
    )
  }

  // 发送邮件，如果检测结果存在
  if (stockRSIReports.length > 0) {
    await sendEmail(stockRSIReports)
  } else {
    console.log('No valid data to send.')
  }
}

// 使用 cron 每天工作日（周一至周五）定时运行
// cron 格式: '秒 分钟 小时 日 月 星期几'
cron.schedule(
  '0 16 * * 1-5',
  () => {
    // 每天下午 16:00 运行
    console.log('Running stock check...')
    getMultipleStocksRSI()
  },
  {
    timezone: 'America/New_York', // 设置时区为美东时间（美国股市常用时区）
  }
)

// Export for test.
module.exports = { getMultipleStocksRSI, getStockRSI }
