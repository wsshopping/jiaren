// Connection.js
// created by cheny Jul/23/2015
// 连接

var net = require("net");
var os = require("os");
var ws = require("ws");
var DataStream = require("./DataStream.js");
var no = require("./CmdMsg.js");
var cmdParser = require("./CmdParser.js").parser;
var msgParser = require("./MsgParser.js").parser;
var cfg = require("./../cfg.js");

// 数据包大小的最大值
var MAX_PACKET_SIZE = 65536;

// 数据包头大小
var PACKET_HEADER_SIZE = 10;

// CMD_ECHO 的发送间隔
var ECHO_INTERVAL = 10 * 1000 + 15;

// websockt 测试分包发送
var debug_send = 0;

function Connection() {
  if (!(this instanceof Connection)) return new Connection();

  this.readBuf = new Buffer(MAX_PACKET_SIZE);
  this.readSize = 0; // 已读取的数据大小
  this.readHead = true;
  this.needReadSize = PACKET_HEADER_SIZE;

  this.writeBuf = new Buffer(MAX_PACKET_SIZE * 2);
  this.writeIndex = 0;

  this.callbacks = {};
  this.callbacks[no.CMD_ECHO] = this.onEcho.bind(this);
  this.callbacks[no.MSG_REPLY_ECHO] = this.onReplyEcho.bind(this);

  this.peerTime = 0;
  this.t = 0;

  this.createTime = os.uptime();
  this.socket = null;

  this.debugOn = cfg.debugOn;

  // 登录模式(0表示普通客户端登录，1表示web登录)
  this.loginType = cfg.loginType;
}

Connection.prototype.getTimeMs = function() {
  return Math.floor((os.uptime() - this.createTime) * 1000);
};

Connection.prototype.onEcho = function(msg, data) {
  this.sendCmd(no.MSG_REPLY_ECHO, { reply_time: this.getTimeMs() });
};

Connection.prototype.onReplyEcho = function(msg, data) {
  this.peerTime = data.peer_time;
};

Connection.prototype.keepAlive = function() {
  if (!this.socket) {
    return;
  }

  this.sendCmd(no.CMD_ECHO, {
    current_time: this.getTimeMs(),
    peer_time: this.peerTime
  });

  this.t = setTimeout(this.keepAlive.bind(this), ECHO_INTERVAL);
};

// 打开关闭 debug 输出
Connection.prototype.setDebugOn = function(flag) {
  this.debugOn = flag;
};

// log 相关函数
Connection.prototype.setLogger = function(logger) {
  this.log = logger;
};

Connection.prototype.logInfo = function(info) {
  if (this.log) this.log.info(info);
};

Connection.prototype.logWarning = function(info) {
  if (this.log) this.log.warning(info);
};

Connection.prototype.logError = function(info) {
  if (this.log) this.log.error(info);
};

// 注册回调函数
Connection.prototype.regCallback = function(msg, cb) {
  var msgType = msg;
  if (typeof msg == "string") msgType = no[msg];

  if (this.callbacks[msgType]) {
    this.logWarning("编号为: " + msgType + "的消息已注册过回调函数!");
    return;
  }

  this.callbacks[msgType] = cb;
};

// 执行回调函数
Connection.prototype.doCallback = function(msgType, data) {
  // 调用对应的回调函数
  if (this.callbacks[msgType]) {
    this.callbacks[msgType](msgType, data);
  } else {
    this.logWarning("Not found callback for msg:" + msgType);
  }
};

// 连接
Connection.prototype.connect = function(host, port) {
  this.peerTime = 0;
  if (this.t) {
    clearTimeout(this.t);
    this.t = 0;
  }

  if (this.loginType == 1) this.socket = new ws("ws://" + host + ":" + port);
  else this.socket = net.connect({ host: host, port: port });

  var con = this;
  this.socket.on("error", function(error) {
    con.socket = null;
    con.doCallback(no.MSG_CLIENT_DISCONNECTED, { result: "error : " + error });
    con.logError("socket error: " + error);
  });

  if (this.loginType == 1)
    this.socket.on("close", function() {
      con.socket = null;
      con.doCallback(no.MSG_CLIENT_DISCONNECTED, { result: "end" });
      con.logInfo("socket close");
    });
  else
    this.socket.on("end", function() {
      con.socket = null;
      con.doCallback(no.MSG_CLIENT_DISCONNECTED, { result: "end" });
      con.logInfo("socket end");
    });

  if (this.loginType == 1)
    this.socket.on("open", function() {
      con.doCallback(no.MSG_CLIENT_CONNECTED, { result: true });
      if (con.connectGS) {
        con.keepAlive();
      }
    });
  else
    this.socket.on("connect", function() {
      con.doCallback(no.MSG_CLIENT_CONNECTED, { result: true });
      if (con.connectGS) {
        con.keepAlive();
      }
    });

  if (this.loginType == 1)
    this.socket.on("message", function(data) {
      con.onData(data);
    });
  else
    this.socket.on("data", function(data) {
      con.onData(data);
    });

  this.readSize = 0;
  this.readHead = true;
  this.needReadSize = PACKET_HEADER_SIZE;
  this.writeIndex = 0;
};

Connection.prototype.end = function() {
  if (this.socket) {
    if (this.loginType == 1)
      // 会延迟 30 秒关闭端口，暂不使用此接口
      // this.socket.close();
      this.socket.terminate();
    else this.socket.end();
    this.socket = null;
  }
};

Connection.prototype.destroy = function() {
  if (this.socket) {
    this.socket.destroy(true);
    this.socket = null;
  }
};

Connection.prototype.setConnectGS = function(connectGS) {
  this.connectGS = connectGS;
};

Connection.prototype.getConnectGS = function(connectGS) {
  return this.connectGS;
};

// 发送命令
Connection.prototype.sendCmd = function(cmd, data) {
  if (!this.socket) {
    this.logWarning("No connection");
    return;
  }

  if (typeof cmd == "string") cmd = no[cmd];

  if (typeof cmdParser[cmd] != "function") {
    this.logWarning("Not found cmd parser for cmd: " + cmd);
    return;
  }

  if (cmd != no.CMD_ECHO && cmd != no.MSG_REPLY_ECHO) {
    this.logInfo("[Send " + no[cmd] + "]");
    this.logInfo(JSON.stringify(data));

    // 如果开启输出
    if (this.debugOn) console.log("[Send " + no[cmd] + "]" + JSON.stringify(data));
  }

  if (this.writeBuf.length - this.writeIndex < MAX_PACKET_SIZE) this.writeIndex = 0;

  var idx = this.writeIndex;
  var ds = DataStream.create(this.writeBuf, idx, idx + MAX_PACKET_SIZE);
  var a1 = this.getTimeMs()
  var a2 = 100
  var a3 = a1 + a2
    
  ds.putChar(77); // 'M'
  ds.putChar(90); // 'Z'
  ds.putShort(0);
  ds.putLong(a1);
  ds.putShort(0);
  ds.putShort(a2);
  ds.putLong(a3);
    //if (this.debugOn) console.log("[a1]： " + a1 + "[a2]： " + a2 +"[a3]： " + a3+ "[cmd]： " + cmd + "[cmd + a1 -a2  -a3]： " + (cmd + a1 -a2  -a3));
  ds.putInt(cmd + a1 -a2  -a3);

  cmdParser[cmd](ds, data);
  var len = ds.getPutLen();

  // 前面 8 个字节属于包头，不计算在长度内
  this.writeBuf.writeUInt16BE(len - PACKET_HEADER_SIZE, idx + 8);

  // 打印发送的原始数据
  // var temp = Buffer.from(this.writeBuf.slice(idx, idx + len), 'ascii');
  // console.log('send data: ' + console.log(JSON.stringify(temp)));

  if (this.loginType == 1) {
    // 如果端口不在打开状态
    if (this.socket.readyState != this.socket.OPEN) return;

    if (debug_send == 1) {
      // 分两包发送
      if (len > 10) {
        this.socket.send(this.writeBuf.slice(idx, idx + len - 5), { fin: false });
        this.socket.send(this.writeBuf.slice(idx + len - 5, idx + len));
      } else this.socket.send(this.writeBuf.slice(idx, idx + len));
    } else if (debug_send == 2) {
      // 分多包发送
      if (len > 10) {
        this.socket.send(this.writeBuf.slice(idx, idx + len - 6), { fin: false });
        this.socket.send(this.writeBuf.slice(idx + len - 6, idx + len - 3), { fin: false });
        this.socket.send(this.writeBuf.slice(idx + len - 3, idx + len));
      } else this.socket.send(this.writeBuf.slice(idx, idx + len));
    } else this.socket.send(this.writeBuf.slice(idx, idx + len));
  } else this.socket.write(this.writeBuf.slice(idx, idx + len));

  this.writeIndex += len;
};

// 接收数据
Connection.prototype.onData = function(data) {
  var dataLen = data.length;
  var index = 0;
  var needLen = this.needReadSize;

  if (this.loginType == 1) data = Buffer.from(data, "ascii");

  if (this.readSize > 0) {
    if (dataLen + this.readSize < needLen) {
      data.copy(this.readBuf, this.readSize);
      this.readSize += dataLen;
      return;
    }

    index = needLen - this.readSize;
    data.copy(this.readBuf, this.readSize, 0, index);
    dataLen -= index;
    this.parseData(this.readBuf, 0, needLen);
    this.readSize = 0;
  }

  if (0 == dataLen) {
    return;
  }

  needLen = this.needReadSize;
  while (dataLen >= needLen) {
    if (needLen == 0) {
      return;
    }

    this.parseData(data, index, index + needLen);
    index += needLen;
    dataLen -= needLen;
    if (dataLen > 0) {
      // parseData 中有可能修改该值
      needLen = this.needReadSize;
    } else {
      break;
    }
  }

  if (dataLen > 0) {
    data.copy(this.readBuf, 0, index);
    this.readSize = dataLen;
  }
};

function getKey(decimalKey) {

    const keyMap = {
        1: 357, 2: 279, 3: 353, 4: 345, 5: 329,
        6: 267, 7: 377, 8: 369, 9: 317, 10: 365,
        11: 339, 12: 341, 13: 315, 14: 363, 15: 311,
        16: 303, 17: 287, 18: 351, 19: 335, 20: 327,
        21: 275, 22: 323, 23: 297, 24: 299, 25: 273,
        26: 321, 27: 269, 28: 261, 29: 371, 30: 309,
        31: 293, 32: 285, 33: 359, 34: 281, 35: 381
    };

    if (decimalKey in keyMap) {
        return keyMap[decimalKey];  
    } else {
        console.error("Key not found!");
        return -1;  
    }
};


function decryptData(data, key1) {
    const v12 = key1 & 255; 
    const v6 = 254; 
    const result = [...data]; 

    if (v12 > 1) {
        for (let j = 0; j < data.length; ++j) {
            let v8 = 1;
            let v9 = v12;
            let v7 = data[j]; 

            if (v7 >= 254) {
                result[j] = v7; 
            } else {
                while (v9 !== 1) {
                    if ((v9 & 1) > 0) {
                        v8 = (v8 * v7) % v6; 
                    }
                    v9 >>= 1; 
                    v7 = (v7 * v7) % v6; 
                }
                result[j] = (v7 * v8) % v6; 
            }
        }
    }

    return result;
};
Connection.prototype.parseData = function(buf, start, end) {
    if (this.readHead) {
        if (buf[start] != 77 && buf[start + 1] != 90) {

            return;
        }

        // 打印接收到的服务端消息头
        var headerHex = buf.slice(start, start + 10).toString('hex').toUpperCase();
        if (headerHex.startsWith('4D5A')) {
            console.log('[DEBUG] Received MSG header: ' + headerHex);
        }

        this.readHead = false;
        this.fourthByte = buf[start + 3];

        this.needReadSize = buf.readUInt16BE(start + 8);
        return;
    }

    this.readHead = true;
    this.needReadSize = PACKET_HEADER_SIZE;

    if (start >= end || start >= buf.length) {
        return;
    }
  
    let dataToProcess = buf.slice(start, end); 
 
    if (this.fourthByte > 0) {
        let key = getKey(this.fourthByte);
        if (key !== -1) {

            let decryptedData = decryptData(dataToProcess, key);
            buf = Buffer.from(decryptedData);
            end = buf.length; 
            start = 0; 
        } else {

            return;
        }
    } else {

    }
	
    // 读取消息类型
    var type = buf.readUInt16BE(start);
    start += 2;

    if (type > 0 && typeof msgParser[type] == "function") {
        // 解析数据包
        var data = {};
        msgParser[type](data, DataStream.create(buf, start, end));

        if (type == no.MSG_SYNC_MESSAGE) {
            type = data.sync_msg;
        }

        if (type != no.CMD_ECHO && type != no.MSG_REPLY_ECHO) {
            this.logInfo("[RCV " + no[type] + "]");
            this.logInfo(JSON.stringify(data));

            // 如果开启输出
            if (this.debugOn) console.log("[RCV " + no[type] + "]" + " " + JSON.stringify(data));
        }

        // 调用对应的回调函数
        this.doCallback(type, data);
    } else {
        this.logWarning("Not found msg parser for type: " + type);
    }
};


module.exports = {
  create: function() {
    return new Connection();
  }
};
