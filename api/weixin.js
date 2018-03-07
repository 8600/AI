'use strict'
const { Config } = require("../config.js")
const https = require("https")
const http  = require("http")
const iconv = require("iconv-lite")

const corpid     = 'wx45fdc4d913745034'

const get_access_token = (corpid, corpsecret) => {
  return new Promise((resolve, reject) => {
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
          // 更新缓存
          const access_token = resData.access_token
          resolve(access_token)
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

const send_message = (sendData, agentid, corpsecret) => {
  get_access_token(corpid, corpsecret).then((access_token) => {
    const message = JSON.stringify({
      "touser" : "@all",
      "msgtype" : "text",
      "agentid" : agentid,
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
}
const send_mpnews = (sendData, agentid, corpsecret) => {
  get_access_token(corpid, corpsecret).then((access_token) => {
    const message = JSON.stringify({
      "touser" : "@all",
      "msgtype" : "mpnews",
      "agentid" : agentid,
      "mpnews" : {
        "articles" : sendData
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
}

exports.send_mpnews = send_mpnews
exports.send_message = send_message