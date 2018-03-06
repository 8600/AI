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
        console.timeEnd('get_SZZZ')
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

const get_HTML = (url) => {
  return new Promise((resolve, reject) => {
    console.time('get_HTML')
    https.get(url, function (res) {  
      let datas = [], size = 0;  
      res.on('data', (data) => {  
        datas.push(data);
        size += data.length;
      })
      res.on("end", () => {
        console.timeEnd('get_HTML')
        const buff = Buffer.concat(datas, size);
        //转码//var result = buff.toString();//不需要转编码,直接tostring  
        const result = iconv.decode(buff, "utf8")
        resolve(result)
      })
    }).on("error", (err) => {  
      console.log(err.stack)
      reject(err.stack)
    })
  })
}

const cutString = (original, before, after, index) => {
  index = index || 0;
  if (typeof index === "number") {
    const P = original.indexOf(before, index);
    if (P > -1) {
      if (after) {
        const f = original.indexOf(after, P + 1);
        return (f > -1) ? original.slice(P + before.toString().length, f) : console.error("owo [在文本中找不到 参数三 " + after + "]");
      } else {
        return original.slice(P + before.toString().length);
      }
    } else {
      console.error("owo [在文本中找不到 参数一 " + before + "]");
    }
  } else {
    console.error("owo [sizeTransition:" + index + "不是一个整数!]");
  }
}
//根据一个基点分割字符串  实例：http://myweb-10017157.cos.myqcloud.com/20161212/%E7%BB%83%E4%B9%A0.zip
const cutStringArray = (original, before, after, index) => {
  var aa = [],
  ab = 0;
  while (original.indexOf(before, index) > 0) {
    aa[ab] = cutString(original, before, after, index);
    index = original.indexOf(before, index) + 1;
    ab++;
  }
  return aa;
}

exports.get_SZZZ = get_SZZZ
exports.get_HTML = get_HTML
exports.cutString = cutString
exports.cutStringArray = cutStringArray