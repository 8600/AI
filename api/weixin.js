'use strict'
const https = require("https")
const http  = require("http")
const iconv = require("iconv-lite")

const corpid     = 'wx45fdc4d913745034'

// GET请求
const $get = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {  
      let datas = [], size = 0
      res.on('data', (data) => {  
        datas.push(data);
        size += data.length;
      })
      res.on("end", () => {  
        const buff = Buffer.concat(datas, size);
        //转码
        //var result = buff.toString();//不需要转编码,直接tostring  
        const result = iconv.decode(buff, "utf8")
        const resData = JSON.parse(result)
        resolve(resData)
      })
    }).on("error", (err) => {
      reject(err.stack)
    })
  })
}

const $post = (options, message, encoded = 'utf-8') => {
  return new Promise((resolve, reject) => {
    let datas = [], size = 0
    let req = https.request(options, (res) => {
      res.on('data', (data) => {
        datas.push(data);
        size += data.length;
      })
      res.on("end", () => {  
        const buff = Buffer.concat(datas, size);
        //转码
        //var result = buff.toString();//不需要转编码,直接tostring  
        const result = iconv.decode(buff, "utf8")
        const resData = JSON.parse(result)
        resolve(resData)
      })
    })
    req.on('error', (e) => {
      console.error(e)
    })
    req.write(message, encoded)
    req.end()
  })
}

// 获取微信access_token
const get_access_token = (corpid, corpsecret) => {
  return new Promise((resolve, reject) => {
    const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpid}&corpsecret=${corpsecret}`
    console.time('获取access_token')
    $get(url).then((data) => {
      console.timeEnd('获取access_token')
      if (data.errcode === 0) {
        // 更新缓存
        const access_token = data.access_token
        console.log(`获取到最新access_token：${access_token}`)
        resolve(access_token)
      } else {
        console.error(data.errcode)
        reject(data)
      }
    })
  })
}
// 主动发送消息
const send_message = (message, corpsecret) => {
  get_access_token(corpid, corpsecret).then((access_token) => {
    const messageOption = JSON.stringify(message)
    const options = {
      hostname: 'qyapi.weixin.qq.com',
      port: 443,
      path: `/cgi-bin/message/send?access_token=${access_token}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(messageOption, 'utf8')
      }
    }
    $post(options, messageOption).then((data) => {
      if (data.errcode !== 0) {
        console.log(data.errmsg)
      }
    })
  })
}

// 从网上获取图片
const get_img_form_url = (url) => {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const { statusCode } = res, contentType = res.headers['content-type']
      let error, imgData = ''
      // 一定要设置response的编码为binary否则会下载下来的图片打不开
      res.setEncoding("binary"); 
      if (statusCode !== 200) {
        reject({errcode: 1, errmsg: `请求失败。\n 状态码: ${statusCode}`})
      } else if (!/^image/.test(contentType)) {
        reject({errcode: 1, errmsg: `无效的 content-type.\n 期望 application/json 但获取的是 ${contentType}`})
      }
      if (error) {
        // 消耗响应数据以释放内存
        res.resume()
        reject({errcode: 1, errmsg: error.message})
      }
      res.on('data', (chunk) => { imgData += chunk; });
      res.on('end', () => {
        // 将图片保存到本地
        resolve({errcode: 0, data: imgData})
      })
    }).on('error', (e) => {
      reject({errcode: 1, errmsg: e.message})
    })
  })
}

// 上传临时素材
const get_media_id = (url, type, corpsecret) => {
  return new Promise((resolve, reject) => {
    get_access_token(corpid, corpsecret).then((access_token) => {
      get_img_form_url(url).then((file) => {
        if (file.errcode === 0) {
          const fileData = file.data
          const options = {
            hostname: 'qyapi.weixin.qq.com',
            port: 443,
            path: `/cgi-bin/media/upload?access_token=${access_token}&type=${type}`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Length': Buffer.byteLength(fileData, 'binary')
            }
          }
          $post(options, fileData, 'binary').then((data) => {
            resolve(data)
          })
        } else {
          reject({errcode: 1, errmsg: file.errmsg})
        }
      })
    })
  })
}

// 发送文本消息
exports.send_text = (text, agentid, corpsecret) => {
  const message = {
    "touser" : "@all",
    "msgtype" : "text",
    "agentid" : agentid,
    "text" : {
      "content" : text
    }
  }
  send_message(message, corpsecret)
}

// 发送图文消息
exports.send_mpnews = (sendData, agentid, corpsecret) => {
  const message = {
    "touser" : "@all",
    "msgtype" : "mpnews",
    "agentid" : agentid,
    "mpnews" : {
      "articles" : sendData
    }
  }
  send_message(message, corpsecret)
}

// 发送图片消息
exports.send_img = (imgUrl, agentid, corpsecret) => {
  get_media_id(imgUrl, 'image', corpsecret).then((media) => {
    const media_id = media.media_id
    const message = {
      "touser" : "@all",
      "msgtype" : "image",
      "agentid" : agentid,
      "image" : {
        "media_id" : media_id
      }
    }
    send_message(message, corpsecret)
  })
}

// 设置菜单
exports.create_menu = (menuData, agentid, corpsecret) => {
  console.time('设置菜单')
  return new Promise((resolve, reject) => {
    get_access_token(corpid, corpsecret).then((access_token) => {
      const menuDataOption = JSON.stringify(menuData)
      const options = {
        hostname: 'qyapi.weixin.qq.com',
        port: 443,
        path: `/cgi-bin/menu/create?access_token=${access_token}&agentid=${agentid}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(menuDataOption, 'utf8')
        }
      }
      $post(options, menuDataOption).then((data) => {
        console.timeEnd('设置菜单')
        if (data.errcode === 0) {
          resolve(data)
        } else {
          console.log(data)
          reject(data)
        }
      })
    })
  })
}

// 获取菜单
exports.get_menu = (agentid, corpsecret) => {
  console.time('设置菜单')
  return new Promise((resolve, reject) => {
    get_access_token(corpid, corpsecret).then((access_token) => {
      $get(`https://qyapi.weixin.qq.com/cgi-bin/menu/get?access_token=${access_token}&agentid=${agentid}`).then((data) => {
        console.timeEnd('设置菜单')
        if (data.errcode === 0) {
          resolve(data.button)
        } else {
          reject(data)
        }
      })
    })
  })
}

// 删除菜单
exports.delete_menu = (agentid, corpsecret) => {
  console.time('删除菜单')
  return new Promise((resolve, reject) => {
    get_access_token(corpid, corpsecret).then((access_token) => {
      $get(`https://qyapi.weixin.qq.com/cgi-bin/menu/delete?access_token=${access_token}&agentid=${agentid}`).then((data) => {
        console.timeEnd('删除菜单')
        if (data.errcode === 0) {
          resolve(data.button)
        } else {
          reject(data)
        }
      })
    })
  })
}