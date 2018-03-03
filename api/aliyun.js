'use strict'
const https = require("https")
const http  = require("http")
const iconv = require("iconv-lite")

// 获取黄金价格
const get_alyun_api = (hostname, path) => {
  return new Promise((resolve, reject) => {
    console.time('get_alyun_api')
    const options = {    
      hostname,
      port: 80,
      path,
      method: 'GET',
      headers: {    
        'Authorization': 'APPCODE 33ca49ac0c3345988b2811ba1f1d701c'    
      }
    }
    const req = http.get(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        console.timeEnd('get_alyun_api')
        try {
          const data = JSON.parse(rawData)
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

exports.get_alyun_api = get_alyun_api