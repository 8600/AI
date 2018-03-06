'use strict'
const { send_mpnews, send_message } = require("./api/weixin.js")
const { get_alyun_api } = require("./api/aliyun.js")
const { get_SZZZ, get_HTML, cutStringArray, cutString } = require("./api/other.js")

const https = require("https")
const http  = require("http")
const iconv = require("iconv-lite")
// 定时器
const schedule = require("node-schedule")



// 18:10 播报黄金价格
const hj = schedule.scheduleJob('0 10 18 * * 0-5', function(){
  get_alyun_api('jisugold.market.alicloudapi.com', '/gold/shgold').then((AuData) => {
    const AuPrice =  AuData.result[0]
    const sendData = `变化幅度: ${AuPrice.changepercent}\n当前价格: ${AuPrice.price}\n开盘价格: ${AuPrice.openingprice}\n最高价格: ${AuPrice.maxprice}\n最低价格: ${AuPrice.minprice}`
    send_message(sendData, 1000002, 'tR2wAukUgH1r4uM1D9UoxlUlnrnsTZeA1CnWurf7EiA')
  })
})

// 08:20 播报天气情况
const tq = schedule.scheduleJob('0 20 8 * * 0-5', () => {
  get_alyun_api('jisutianqi.market.alicloudapi.com', '/weather/query?&location=40.0290174743,116.3471711919').then((weatherData) => {
    const result = weatherData.result
    const sendData = `天气情况: ${result.weather}\n最高气温: ${result.temphigh}\n最低气温: ${result.templow}\n风力等级: ${result.windpower}\n污染程度: ${result.aqi.quality}`
    send_message(sendData, 0, '2BTviSRpLh-mH3MS7E4PmI_PUIV1JoVhQJvxwnHpUC0')
  })
})

// 22:00 播报微信精选
const wxjx = schedule.scheduleJob('0 0 22 * * *', () => {
  get_alyun_api('ali-weixin-hot.showapi.com', '/articleDetalList?&typeId=9').then((articleDetalList) => {
    let sendData = ''
    const newsList = articleDetalList.showapi_res_body.pagebean.contentlist
    for (let i = 0; i < 5; i++) {
    sendData += `${i}. <a href=\"${newsList[i].url}">${newsList[i].title}</a>\n`
    }
    send_message(sendData, 1000003, 'k_cPkWtZ5flbl8nuL0qVLQJQtBwcEuXVdn4LoQ7x7NE')
  })
})
// 18:11 播报上证指数
const szzs = schedule.scheduleJob('0 11 18 * * 1-5', () => {
  get_SZZZ().then((res) => {
    const result = res.data[0]
    const sendData = `变化幅度: ${result.netChangeRatio.toFixed(2)}%\n收盘价格: ${result.close.toFixed(2)}\n开盘价格: ${result.open.toFixed(2)}\n最低价格: ${result.low.toFixed(2)}\n最高价格: ${result.high.toFixed(2)}`
    send_message(sendData, 1000004, 'f2dXoaXsKBYkye2m2uhav4XONZQkCx-AqtW43OGbGQs')
  })
})

// 21:10 github今日热点 待完善
const szzs = schedule.scheduleJob('0 10 21 * * *', () => {
  get_HTML('https://github.com/trending').then((data) => {
    const title = cutStringArray(data, 'class="text-normal">', '\n')
    const text = cutStringArray(data, 'm-0 pr-4">\n        ', '      </p>')
    // console.log(title)
    let sendData = ''
    for(let item in title) {
      let dataTemp = title[item] + '\n' + text[item]
      console.log(text[item])
      // 去除人名和库中间的多余字符
      dataTemp = dataTemp.replace(/\<\/span>/g, '')
      // 垃圾代码暂时这么写吧
      if (dataTemp.indexOf('g-emoji') >= 0) {
        const cutTemp = '<g-emoji' + cutString(dataTemp, '<g-emoji', '</g-emoji>') + '</g-emoji>'
        dataTemp = dataTemp.replace(cutTemp, '')
      }
      if (dataTemp.indexOf('g-emoji') >= 0) {
        const cutTemp = '<g-emoji' + cutString(dataTemp, '<g-emoji', '</g-emoji>') + '</g-emoji>'
        dataTemp = dataTemp.replace(cutTemp, '')
      }
      sendData += dataTemp + '\n-----------------\n'
    }
    send_message(sendData, 1000005, 'fc9UpYBtGq3GHb9mg8oXu5ntBOALF1ztM26nmJcELv4')
  })
})