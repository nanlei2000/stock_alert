// @ts-check
const axios = require('axios').default
const { agent } = require('./util')

// 可用的 User-Agent 列表
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.67 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.67 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.67 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:100.0) Gecko/20100101 Firefox/100.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 12.4; rv:100.0) Gecko/20100101 Firefox/100.0',
]

// 随机选择一个 User-Agent
function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)]
}

// 获取 CNN Fear & Greed Index
async function getFearGreedIndex() {
  try {
    const url = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata'
    // 随机设置 User-Agent
    const headers = {
      'User-Agent': getRandomUserAgent(),
    }
    const response = await axios.get(url, { headers, httpsAgent: agent })

    // 解析返回的 JSON 数据
    const { score, rating, timestamp } = response.data.fear_and_greed
    console.log(`Fear & Greed Index: ${score}, Rating: ${rating}, Timestamp: ${timestamp}`)

    return { score, rating }
  } catch (error) {
    console.error('Error fetching Fear & Greed Index:', error)
    return null
  }
}

module.exports = { getFearGreedIndex }
