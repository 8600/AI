'use strict'
const https = require("https")
const http  = require("http")
const iconv = require("iconv-lite")
// 定时器
const schedule = require("node-schedule")

const corpid     = 'wx45fdc4d913745034',
      corpsecret = 'tR2wAukUgH1r4uM1D9UoxlUlnrnsTZeA1CnWurf7EiA'


const get_access_token = () => {
  return new Promise((resolve, reject) => {
    console.time('get_access_token')
    const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpid}&corpsecret=${corpsecret}`
    https.get(url, function (res) {  
      let datas = [], size = 0;  
      res.on('data', (data) => {  
        datas.push(data);
        size += data.length;
      })
      res.on("end", () => {  
        const buff = Buffer.concat(datas, size);
        //转码//var result = buff.toString();//不需要转编码,直接tostring  
        const result = iconv.decode(buff, "utf8")
        const resData = JSON.parse(result)
        if (resData.errcode === 0) {
          console.timeEnd('get_access_token')
          const access_token = resData.access_token
          return resolve(access_token)
        } else {
          console.log(resData)
          reject(resData)
        }
      })
    }).on("error", (err) => {  
      console.log(err.stack)
      reject(err.stack)
    })
  })
}

const get_au_price = () => {
  return new Promise((resolve, reject) => {
    console.time('get_au_price')
    const options = {    
      hostname: 'jisugold.market.alicloudapi.com',
      port: 80,
      path: '/gold/shgold',
      method: 'GET',
      headers: {    
        'Authorization': 'APPCODE 33ca49ac0c3345988b2811ba1f1d701c'    
      }
    }
    const req = http.get(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          console.timeEnd('get_au_price')
          const data = JSON.parse(rawData).result[0]
          resolve(data)
        } catch (e) {
          console.error(e.message);
        }
      })
      req.on('error', (e) => {
        console.log('problem with request: ' + e.message)
      })
    })
    req.end()
  })
}

const sendMessage = () => {
  get_access_token().then((access_token) => {
    get_au_price().then((AuPrice) => {
      const sendData = `变化幅度: ${AuPrice.changepercent}\n当前价格: ${AuPrice.price}\n开盘价格: ${AuPrice.openingprice}\n最高价格: ${AuPrice.maxprice}\n最低价格: ${AuPrice.minprice}`
      const message = JSON.stringify({
        "touser" : "@all",
        "msgtype" : "text",
        "agentid" : 1000002,
        "text" : {
          "content" : sendData
        }
      })
      const options = {
        hostname: 'qyapi.weixin.qq.com',
        port: 443,
        path: `/cgi-bin/message/send?access_token=${access_token}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(message, 'utf8')
        }
      }
      // console.log(JSON.stringify(message))
      let req = https.request(options, (res) => {
        res.on('data', (d) => {
          // console.log(d)
          process.stdout.write(d);
        })
      })
      
      req.on('error', (e) => {
        console.error(e)
      })
      req.write(message, 'utf-8')
      req.end()
    })
  })
}

const j = schedule.scheduleJob('0 10 18 * * 0-5', function(){
  sendMessage()
})