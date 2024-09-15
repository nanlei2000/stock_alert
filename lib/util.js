const HttpsProxyAgent = require('https-proxy-agent').HttpsProxyAgent

// 设置代理地址，例如：'http://username:password@proxyserver.com:8080'
// clash
const proxy = 'http://127.0.0.1:7890'

// 创建一个代理实例
const agent = new HttpsProxyAgent(proxy)

module.exports = { agent }
