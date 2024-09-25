// @ts-check
const nodemailer = require('nodemailer')
const cron = require('node-cron')
const fs = require('fs')
const { getFearGreedIndex } = require('./lib/fear_greed')
const { getStockRSI } = require('./lib/rsi')
const { getVIXInfo } = require('./lib/vix')

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
        stockRSIReports.push(`RSI for ${stockRSI.stock} is below 32. Current RSI: ${stockRSI.rsi}. Consider buying.`)
      } else if (stockRSI.rsi > 68) {
        stockRSIReports.push(`RSI for ${stockRSI.stock} is above 68. Current RSI: ${stockRSI.rsi}. Consider selling.`)
      } else {
        stockRSIReports.push(`RSI for ${stockRSI.stock} is ${stockRSI.rsi}.`)
      }
    } else {
      stockRSIReports.push(`Failed to retrieve data for ${stockRSI.stock}: ${stockRSI.error}`)
    }
  }

  // 获取 VIX 指数
  const vixInfo = await getVIXInfo()
  if (vixInfo) {
    stockRSIReports.push(`VIX index is ${vixInfo.price} (MA20: ${vixInfo.ma20}).`)
  }

  // 获取 CNN Fear & Greed Index
  const fearGreedIndex = await getFearGreedIndex()

  // 如果指数为 "Fear" 或 "Extreme Fear"，添加到报告中
  if (
    fearGreedIndex
    // (fearGreedIndex.rating.toLowerCase() === 'fear' ||
    //   fearGreedIndex.rating.toLowerCase() === 'extreme fear')
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
  '0 22 * * 1-5',
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
