'use strict'
const weixin = require("./api/weixin.js")
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
    weixin.send_text(sendData, 1000002, 'tR2wAukUgH1r4uM1D9UoxlUlnrnsTZeA1CnWurf7EiA')
  })
})

// 08:20 播报天气情况
const tq = schedule.scheduleJob('0 20 8 * * 0-5', () => {
  get_alyun_api('jisutianqi.market.alicloudapi.com', '/weather/query?&location=40.0290174743,116.3471711919').then((weatherData) => {
    const result = weatherData.result
    const sendData = `天气情况: ${result.weather}\n最高气温: ${result.temphigh}\n最低气温: ${result.templow}\n风力等级: ${result.windpower}\n污染程度: ${result.aqi.quality}`
    weixin.send_text(sendData, 0, '2BTviSRpLh-mH3MS7E4PmI_PUIV1JoVhQJvxwnHpUC0')
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
    weixin.send_text(sendData, 1000003, 'k_cPkWtZ5flbl8nuL0qVLQJQtBwcEuXVdn4LoQ7x7NE')
  })
})
// 18:11 播报上证指数
const szzs = schedule.scheduleJob('0 11 18 * * 1-5', () => {
  get_SZZZ().then((res) => {
    const result = res.data[0]
    const sendData = `变化幅度: ${result.netChangeRatio.toFixed(2)}%\n收盘价格: ${result.close.toFixed(2)}\n开盘价格: ${result.open.toFixed(2)}\n最低价格: ${result.low.toFixed(2)}\n最高价格: ${result.high.toFixed(2)}`
    weixin.send_text(sendData, 1000004, 'f2dXoaXsKBYkye2m2uhav4XONZQkCx-AqtW43OGbGQs')
  })
})

// 21:10 github今日热点 待完善
const jrrd = schedule.scheduleJob('0 10 21 * * *', () => {
  // 递归去除表情
  function removeEmoj (str) {
    if (str.indexOf('g-emoji') >= 0) {
      const cutTemp = '<g-emoji' + cutString(str, '<g-emoji', '</g-emoji>') + '</g-emoji>'
      str = str.replace(cutTemp, '')
      return removeEmoj(str)
    } else {
      return str
    }
  }
  get_HTML('https://github.com/trending').then((html) => {
    // 截取出部分文字
    const data = cutString(html, '<ol', 'ol>')
    let liData = cutStringArray(data, '<li', 'li>')
    for(let item in liData) {

    }
    liData.forEach(element => {
      element = element.replace(/\n/g, '')
      element = element.replace(/  /g, '')
      const title = cutString(element, '</span>', '</a>')
      let text = cutString(element, 'm-0 pr-4">', '</p>')
      text = removeEmoj(text)
      // 截取热度
      const startBox = cutString(element, 'd-inline-block float-sm-right', 'span>')
      const start = cutString(startBox, '4.74z"/></svg>', ' stars today')
      // 判断是否有语言
      let sendText = null
      if (element.indexOf('programmingLanguage') > 0) {
        const programmingLanguage = cutString(element, 'programmingLanguage">', '</span>')
        sendText = `名称:${title}\n热度:${start}  语言:${programmingLanguage}\n描述:${text}`
      } else {
        sendText = `名称:${title}\n热度:${start}\n描述:${text}`
      }
      weixin.send_text(sendText, 1000005, 'fc9UpYBtGq3GHb9mg8oXu5ntBOALF1ztM26nmJcELv4')
    })
  })
})
// weixin.send_img('http://j4.dfcfw.com/charts/pic6/110022.png', 1000004, 'f2dXoaXsKBYkye2m2uhav4XONZQkCx-AqtW43OGbGQs')
const menuData = {
  "button":[
    {    
      "type":"click",
      "name":"获取数据",
      "key":"V1001_TODAY_MUSIC"
    }
  ]
}
// 设置菜单
weixin.create_menu(menuData, 1000004, 'f2dXoaXsKBYkye2m2uhav4XONZQkCx-AqtW43OGbGQs').then((data) => {
  console.log('设置成功')
})