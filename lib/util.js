// @ts-check
const HttpsProxyAgent = require('https-proxy-agent').HttpsProxyAgent
const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)
dayjs.extend(timezone)

// 设置代理地址，例如：'http://username:password@proxyserver.com:8080'
// clash
const proxy = 'http://127.0.0.1:7890'
// 创建一个代理实例
const agent = process.env.CLASH === '0' ? undefined : new HttpsProxyAgent(proxy)

/**
 * 获取最近 n 天的开始和结束日期
 * @param {number} n
 * @returns
 */
function getLastNDaysPeriod(n) {
  // 获取今天的日期
  const end = dayjs().tz('America/New_York').format('YYYY-MM-DD')

  // 获取 30 天前的日期
  const start = dayjs().tz('America/New_York').subtract(n, 'day').format('YYYY-MM-DD')

  return { start, end }
}

function fixDigit(num) {
  if (typeof num !== 'number') {
    return num
  }

  return Math.round(num * 100) / 100
}

module.exports = { agent, getLastNDaysPeriod, fixDigit }
