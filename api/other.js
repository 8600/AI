'use strict'
const https = require("https")
const iconv = require("iconv-lite")

const get_SZZZ = () => {
  return new Promise((resolve, reject) => {
    console.time('get_SZZZ')
    const url = `https://gupiao.baidu.com/api/rails/stockbasicbatch?format=json&stock_code=sh000001&${Date.parse(new Date())}`
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
        resolve(resData)
      })
    }).on("error", (err) => {  
      console.log(err.stack)
      reject(err.stack)
    })
  })
}

exports.get_SZZZ = get_SZZZ