const yahooFinance = require('yahoo-finance2').default
const { RSI } = require('technicalindicators')
const nodemailer = require('nodemailer')
const cron = require('node-cron')

// 读取配置文件
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'))

// SMTP 邮件发送配置，从配置文件读取
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.auth.user,
    pass: config.smtp.auth.pass
  }
})

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
      await sendEmail(currentRSI) // 发送邮件通知
    }
  } catch (error) {
    console.error('Error fetching stock data:', error)
  }
}

// 发送邮件函数
async function sendEmail(currentRSI) {
  const mailOptions = {
    from: config.email.from, // 从配置文件读取发件人
    to: config.email.to, // 从配置文件读取收件人
    subject: 'RSI Notification: AAPL Stock',
    text: `The RSI for AAPL is below 30. Current RSI: ${currentRSI}. It may be a buying opportunity.`
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('Email sent successfully.')
  } catch (error) {
    console.error('Error sending email:', error)
  }
}

// 使用 cron 每天工作日（周一至周五）定时运行
// cron 格式: '秒 分钟 小时 日 月 星期几'
cron.schedule(
  '0 16 * * 1-5',
  () => {
    // 每天下午 16:00 运行
    console.log('Running stock check...')
    getStockData()
  },
  {
    timezone: 'America/New_York' // 设置时区为美东时间（美国股市常用时区）
  }
)
