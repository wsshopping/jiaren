// client.js
// Created by chenyq Jul/14/2015
// 一个客户端代表一个玩家

var sysu = require("util");
var crypt = require("crypto");
var net = require("net");
var exec = require("child_process").exec;
var cfg = require("./cfg.js");
var ver = require("./version.js");
var Me = require("./me.js");
var comm = require("./comm/Comm.js");
var Log = require("./lib/log.js");
var DES = require("./lib/des.js");
var Const = require("./Const.js");
const fs = require('fs');
var os = require("os");
var crypto = require("crypto");
var utils = require("./comm/Utils.js");
var http = require("http");

function Client(connectType) {
  if (!(this instanceof Client)) return new Client();

  this.connectType = connectType;
  this.connection = comm.createConnection();
  this.account = "";
  this.me = Me.create(this.connection);
  this.connectAAA = false;
  this.connectGS = false;
  this.createCount = 0;
  this.connectAAACount = 0;
  this.lineupLogin = 0;

  if (connectType == Const.CONNECT_TYPE.NORMAL) {
    this.regSelfCallback("MSG_CLIENT_CONNECTED", this.onConnected);
    this.regSelfCallback("MSG_CLIENT_DISCONNECTED", this.onDisConnected);
    this.regSelfCallback("MSG_L_ANTIBOT_QUESTION", this.onAntibotQuestion);
    this.regSelfCallback("MSG_L_CHECK_USER_DATA", this.onCheckUserData);
    this.regSelfCallback("MSG_L_START_LOGIN", this.onStartLogin);
    this.regSelfCallback("MSG_L_AUTH", this.onAuth);
    this.regSelfCallback("MSG_L_SERVER_LIST", this.onServerList);
    this.regSelfCallback("MSG_L_AGENT_RESULT", this.onAgentResult);
    this.regSelfCallback("MSG_EXISTED_CHAR_LIST", this.onCharList);
    this.regSelfCallback("MSG_RANDOM_NAME", this.onRandomName);
    this.regSelfCallback("MSG_L_WAIT_IN_LINE", this.onWaitInLine);
    this.regSelfCallback("MSG_DIALOG_OK", this.onDialogOk);
    this.regSelfCallback("MSG_NOTIFY_MISC_EX", this.onNotifyMiscEx);
    this.regSelfCallback("MSG_OTHER_LOGIN", this.onOtherLogin);
    this.regSelfCallback("MSG_ACCOUNT_IN_OTHER_SERVER", this.onAccountInOtherServer);
    this.regSelfCallback("MSG_SWITCH_SERVER", this.onSwitchServer);
    this.regSelfCallback("MSG_SWITCH_SERVER_EX", this.onSwitchServer);
    this.regSelfCallback("MSG_SPECIAL_SWITCH_SERVER_EX", this.onSpecialSwitchServerEx);
  } else {
    this.regSelfCallback("MSG_CLIENT_CONNECTED", this.onLineUpConnected);
    this.regSelfCallback("MSG_CLIENT_DISCONNECTED", this.onLineUpDisConnected);
    this.regSelfCallback("MSG_L_START_LOGIN", this.onLineUpStartLogin);
    this.regSelfCallback("MSG_L_CHARGE_DATA", this.onChargeData);
  }
}

Client.prototype.getAAA = function() {
  return this.connectAAA;
};

Client.prototype.getGs = function() {
  return this.connectGS;
};

Client.prototype.setDebugOn = function(flag) {
  this.connection.setDebugOn(flag);
};

Client.prototype.trace = function(info) {
  if (!cfg.enableTrace) return;

  console.log("[" + os.uptime() + "][" + this.account + "] " + info);
  if (this.log) {
    this.log.info(info);
  }
};

Client.prototype.info = function(info) {
  if (this.log) {
    this.log.info(info);
  }
};

Client.prototype.warning = function(info) {
  if (this.log) {
    this.log.warning(info);
  }
};

Client.prototype.error = function(info) {
  if (this.log) {
    this.log.error(info);
  }
};

//去除角色名字中的数字
// Client.prototype.buildCharName = function(oldName) {
//   var m = {
//     0   : 'a',
//     1   : 'b',
//     2   : 'c',
//     3   : 'd',
//     4   : 'e',
//     5   : 'f',
//     6   : 'g',
//     7   : 'h',
//     8   : 'i',
//     9   : 'k',
//   };
//
//   var len = oldName.length;
//   var name, subName;
//
//   name = oldName;
//
//   if (len > 5)
//   {
//     subName = oldName.substr(0, len - 5);
//     name = subName.replace(/(\d{1})/g, function(a) {
//       return m[a];
//     }) + oldName.substring(len - 5);
//   }
//
//   if (this.createCount > 0)
//   {
//     subName = this.createCount.toString(10);
//     name += subName.replace(/(\d{1})/g, function(a) {
//       return m[a];
//     });
//   }
//
//   return name;
// }
Client.prototype.buildCharName = function(gender) {
  let names = [];
  if (gender === 1) {
    names = cfg.maleNames;
  } else if (gender === 2) {
    names = cfg.femaleNames;
  }

  if (names.length === 0) {
    return 'DefaultName';
  }

  let randomIndex = Math.floor(Math.random() * names.length);
  let randomName = names[randomIndex];
  return randomName;
};

// 设置 aaa 信息
Client.prototype.setAAA = function(host, port) {
  this.aaaHost = host;
  this.aaaPort = port;
};

// 设置 gs 信息
Client.prototype.setGs = function(thost, port) {
  this.gs = host;
  this.gsPort = port;
};

// 设置帐号跟密码
Client.prototype.setAccount = function(account, pwd) {
  this.account = account;
  this.pwd = pwd;
  this.me.setAccount(account);
};

// 登录
Client.prototype.login = function(loginType) {
  // this.log = Log.create(cfg.logPath, account);
  this.connection.setLogger(this);
  this.trace("login.sart " + this.loginAAAStep + " connectType: " + this.connectType);
  this.connectAAA = true;
  this.connectGS = false;
  this.connection.setConnectGS(false);
  this.loginAAAStep = 0;
  this.loginType = null == loginType ? Const.ACCOUNT_TYPE.NORMAL : loginType;
  ++this.connectAAACount;

  if (this.connection.socket) {
    // 存在旧连接
    this.connection.end();
  } else {
    // 没有连接，连接 AAA
    this.trace("connecting aaa: " + this.aaaHost + ":" + this.aaaPort);
    this.connection.connect(this.aaaHost, this.aaaPort);
  }
};

// 注销
Client.prototype.logout = function() {
  this.connectGS = false;
  this.connection.setConnectGS(false);
  this.connectAAA = false;
  this.sendCmd("CMD_LOGOUT", { reason: 3 });
};

Client.prototype.regCallback = function(msg, func) {
  this.connection.regCallback(msg, func);
};

Client.prototype.regSelfCallback = function(msg, func) {
  this.regCallback(msg, func.bind(this));
};

// 发送命令给服务器
Client.prototype.sendCmd = function(cmd, data) {
  this.connection.sendCmd(cmd, data);
};

Client.prototype.encrypt = function(text, rawKey, cb) {
  var key = DES.d3MakeKey(rawKey);
  var des = DES.create(key);
  var out = des.encrypt(text);
  cb(null, out);
};

// 请求线路信息
Client.prototype.doRequestLine = function(type) {
  if (1 != this.loginAAAStep) return;

  if (!this.connectAAA) {
    // 与 AAA 没有连接
    this.login();
    return;
  }

  this.trace(" CMD_L_REQUEST_LINE_INFO.");
  this.sendCmd("CMD_L_REQUEST_LINE_INFO", { account: this.account });

  if (this.requestLineTimer) {
    // 定时器有效
    clearTimeout(this.requestLineTimer);
  }

  // xx 秒后重试
  var obj = this;
  this.requestLineTimer = setTimeout(function() {
    obj.doRequestLine("setTimeout" + os.uptime());
  }, 180000);
};

// 登录
Client.prototype.doLogin = function() {
  if (this.me.loginTimer) {
    clearTimeout(this.me.loginTimer);
    this.me.loginTimer = 0;
  }

  this.trace(" CMD_LOGIN.");
  this.sendCmd("CMD_LOGIN", {
    user: this.account,
    seed: this.seed,
    auth_key: this.authKey,
    emulator: 1,
    sight_scope: 0,
    version: ver.ver_code,
    clientid: "",
    netStatus: 0,
    adult: -1,
    signature: "",
    clientname: ""
  });
};

Client.prototype.onConnected = function(msg, data) {
  if (!data.result) {
    this.onDisConnected(0, data);
    return;
  }

  this.trace("connected!");
  if (this.connectAAA) {
    // 连接 AAA 成功
    this.loginAAAStep = 1;

    // 请求队列信息
    this.doRequestLine("onConnected");
  } else {
    // 连接 gs 成功
    this.doLogin();
  }
};

Client.prototype.onDisConnected = function(msg, data) {
  this.trace("onDisConnected : " + data.result);
  this.trace("loginAAAStep : " + this.loginAAAStep);

  var obj = this;

  if (this.connectAAA) {
    this.trace("AAA disconnected!");

    // aaa 断开连接了
    this.connectAAA = false;

    if (2 == this.loginAAAStep) {
      return;
    }

    if (4 == this.loginAAAStep) {
      this.trace("connecting gs: " + this.gs + ":" + this.gsPort);
      this.connectGS = true;
      this.connection.setConnectGS(true);
      this.connection.connect(this.gs, this.gsPort);
      return;
    }

    // n 秒后，重连aaa
    setTimeout(function() {
      if (obj.connectAAA || obj.connectGS) return;

      obj.login();
    }, 30000);
  } else if (this.connectGS) {
    if (this.me.isInswitchServer) {
      this.me.isInswitchServer = false;

      // 需要连接 GS
      this.trace("switch to gs: " + this.gs + ":" + this.gsPort);
      this.connection.setConnectGS(true);
      this.connection.connect(this.gs, this.gsPort);
    } else {
      this.trace("GS disconnected!");

      // gs 断开连接了
      this.connectGS = false;
      this.connection.setConnectGS(false);

      // n 秒后，重连aaa
      setTimeout(function() {
        if (obj.connectAAA || obj.connectGS) return;

        obj.login();
      }, 10000);
    }
  } else {
    // 已经都连接上了，断开了
    this.trace("logout disconnected!");
  }
};

// 换线
Client.prototype.onSwitchServer = function(msg, msgData) {
  if (!msgData.result) return;

  var args = msgData.msg.split(",");

  this.gs = args[0];
  this.gsPort = args[1];

  var arrUint32 = new Uint32Array([args[2], args[3]]);
  this.authKey = arrUint32[0];
  this.seed = arrUint32[1];

  // 断开连接
  this.me.isInswitchServer = true;
  this.connection.end();
  this.trace("onSwitchServer.end");
};

// 跨服换线
Client.prototype.onSpecialSwitchServerEx = function(msg, msgData) {
  if (!msgData.result) return;

  var args = msgData.msg.split(",");
  this.gs = args[0];
  this.gsPort = args[1];

  var arrUint32 = new Uint32Array([args[2], args[3]]);
  this.authKey = arrUint32[0];
  this.seed = arrUint32[1];
  this.char = args[4];

  // 断开连接
  this.me.isInswitchServer = true;
  this.connection.destroy();
  this.trace("onSpecialSwitchServerEx.end");
};

Client.prototype.onAntibotQuestion = function(msg, msgData) {
  this.sendCmd("CMD_L_CHECK_USER_DATA", { data: "" });
};

Client.prototype.onCheckUserData = function(msg, msgData) {
  if (!msgData.result) {
    this.connection.logError("Check user data failed!");
  } else {
    this.cookie = msgData.cookie;
    var client = this;
	let userId = client.account;
    if (userId.startsWith("110001")) {
        userId = userId.slice(6);
    }	
	let token = crypto.createHash('md5').update(userId).digest('hex');
    this.encrypt(`userId=${userId}&game=wd&channelNo=110001&token=${token}`, this.cookie, function(error, encodePwd) {
      if (error) {
        client.logError(JSON.stringify(error));
        client.connection.end();

        this.trace("onCheckUserData.end");
      } else {
        client.sendCmd("CMD_L_ACCOUNT", {
          type: client.loginType,
          account: client.account,
          pwd: encodePwd,
          mac: "console_mac",
          data: "",
          lock: "",
          dist: cfg.dist,
          auth3rd: 0,
          ver: ver.ver
        });
      }
    });
  }
};

Client.prototype.onAuth = function(msg, data) {
  if (data.result != 1) {
    this.trace("onAuth : " + data.msg);

    this.connection.logError("onAuth: " + data.msg);
    return;
  }

  this.authKey = data.auth_key;
  this.trace("CMD_L_GET_SERVER_LIST");
  this.sendCmd("CMD_L_GET_SERVER_LIST", {
    account: this.account,
    auth_key: this.authKey,
    dist: cfg.dist
  });
};

Client.prototype.onServerList = function(msg, data) {
  if (data.count < 1) {
    this.connection.logError("Not found game server!");
    return;
  }

  if (null != cfg.gs) {
    this.sendCmd("CMD_L_CLIENT_CONNECT_AGENT", {
      account: this.account,
      auth_key: this.authKey,
      server: cfg.gs
    });

    return;
  }

  this.sendCmd("CMD_L_CLIENT_CONNECT_AGENT", {
    account: this.account,
    auth_key: this.authKey,
    server: data.server0
  });
};

Client.prototype.onAgentResult = function(msg, data) {
  this.seed = data.seed;
  this.authKey = data.authKey;
  if (data.result != 0) {
    this.gs = data.ip;
    this.gsPort = data.port;
    this.connection.end();

    this.trace("onAgentResult.end");

    this.loginAAAStep = 4;
  } else {
    this.trace("agentResult : " + data.msg);
    this.connection.logError("onAgentResult: " + data.msg);

    this.loginAAAStep = 5;
  }
};
function getRandomName() {
  // let maleRawData = fs.readFileSync(path.join(__dirname, 'name.json'));
  // console.log(maleRawData,'maleRawData')
  let maleRawData1 = fs.readFileSync('./name.json');
  var  arr = JSON.parse(maleRawData1)
  var chineseString = arr.toString()
  const minLength = 2;
  const maxLength = 6;
  const nameLength = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
  const startIndex = Math.floor(Math.random() * (chineseString.length - nameLength));
  return chineseString.substr(startIndex, nameLength);
}
Client.prototype.onCharList = function(msg, data) {
    // 标记为还没进入游戏世界
    if (this.me.loginTimer) {
        clearTimeout(this.me.loginTimer);
    }

    this.me.loginTimer = setTimeout(this.doLogin.bind(this), 30000);

    if (data.count == 0) {
        this.polar = (Math.floor(Math.random() * 10) % 5) + 1;
        this.gender = parseInt(this.account[this.account.length - 1]) % 2 == 1 ? 1 : 2;
        //let randomName = this.buildCharName(this.gender);
        this.sendCmd('CMD_RANDOM_NAME', { gender : this.gender - 1});//服务端方法
        this.onRandomName(1, { new_name: this.buildCharName(this.account) });//服务端方法
      // let randomName =  getRandomName()
      // this.onRandomName(1, { new_name: randomName });
        ++this.createCount;
    } else if (data[0].trading_state == 0 || data[0].trading_state == Const.TRADING_STATE.SHOW) {
        // 加载第一个角色
       this.sendCmd("CMD_LOAD_EXISTED_CHAR", { char_name: data[0].name });
        this.trace("load char: " + data[0].name);
    } else if (data[0].trading_state == Const.TRADING_STATE.TIMEOUT || data[0].trading_state == Const.TRADING_STATE.CANCEL || data[0].trading_state == Const.TRADING_STATE.FORCE_CLOSED) {
        // 角色寄售已经超时了，自动取回
        this.sendCmd("CMD_TRADING_CANCEL_ROLE", { gid: data[0].gid });
        this.trace("get back char from trading: " + data[0].name);
    } else {
        this.trace("cannot load char: " + data[0].name + " state:" + data[0].trading_state);
    }
};

Client.prototype.onRandomName = function(msg, data) {
  this.trace("create char: " + data.new_name);
  this.sendCmd("CMD_CREATE_NEW_CHAR", {
    polar: this.polar,
    gender: this.gender,
    char_name: data.new_name
  });
};

Client.prototype.onWaitInLine = function(msg, data) {
  this.trace(" wait in line line_name : " + data.line_name + ", expect_time : " + data.expect_time + ", reconnet_time : " + data.reconnet_time + ", location : " + data.location + ", count : " + data.count + ", keep_alive : " + data.keep_alive + ", need_wait : " + data.need_wait);

  if (this.requestLineTimer) {
    // 定时器有效
    clearTimeout(this.requestLineTimer);
    this.requestLineTimer = 0;
  }

  if (this.loginAAAStep == 3) {
    return;
  }

  if (this.loginAAAStep == 4) {
    return;
  }

  this.loginAAAStep = 2;

  // 压力测试下一次连接的数据
  var interval = 0;
  if (data.expect_time < 180) {
    interval = data.reconnet_time;
  } else {
    interval = 10 + data.reconnet_time;
  }

  interval = interval * 1000;

  if (this.waitInTimer) {
    // 定时器有效
    clearTimeout(this.waitInTimer);
    this.waitInTimer = 0;
  }

  var obj = this;
  this.waitInTimer = setTimeout(function() {
    if (obj.loginAAAStep == 3) {
      return;
    }

    if (obj.loginAAAStep == 4) {
      return;
    }

    if (0 == data.keep_alive) {
      obj.trace("set timeout login");
      obj.login();
    } else if (1 == data.keep_alive) {
      obj.loginAAAStep = 1;
      obj.doRequestLine("onWaitInLine");
    }
  }, interval);
};

Client.prototype.onStartLogin = function(msg, msgData) {
  this.trace(" start login.");

  if (this.loginAAAStep == 3) {
    return;
  }

  this.loginAAAStep = 3;
  this.cookie = msgData.cookie;
  var client = this;
  let userId = client.account;
    if (userId.startsWith("110001")) {
        userId = userId.slice(6);
    }  
  let token = crypto.createHash('md5').update(userId).digest('hex'); 
  this.encrypt(`userId=${userId}&game=wd&channelNo=110001&token=${token}`, this.cookie, function(error, encodePwd) {
    if (error) {
      client.logError(JSON.stringify(error));
      client.connection.end();
      this.trace("onStartLogin.end");
    } else {
      client.trace("CMD_L_ACCOUNT");
      client.sendCmd("CMD_L_ACCOUNT", {
        account: client.account,
        pwd: encodePwd,
        mac: "console_mac",
        data: "",
        lock: "",
        dist: cfg.dist,
        auth3rd: 0,
        ver: ver.ver
      });
    }
  });
};

Client.prototype.onChargeData = function(msg, msgData) {
  this.trace("onChargeData : " + this.account);

  // TODO 接收到充值数据
  // TODO 考虑发送给服务器，有服务器实现 http 请求
};

Client.prototype.onLineUpConnected = function(msg, msgData) {
  if (this.lineupLogin == 1) {
    var client = this;
	let userId = client.account;



    if (userId.startsWith("110001")) {

        userId = userId.slice(6);
    }
    let token = crypto.createHash('md5').update(userId).digest('hex');

    this.encrypt(`userId=${userId}&game=wd&channelNo=110001&token=${token}`, this.cookie, function(error, encodePwd) {
      if (error) {
        client.logError(JSON.stringify(error));
        client.connection.end();
        this.trace("charge onConnected.end");
      } else {
        client.trace("charge CMD_L_ACCOUNT");
        client.sendCmd("CMD_L_ACCOUNT", {
          type: client.loginType,
          account: client.account,
          pwd: encodePwd,
          mac: "console_mac",
          data: "",
          lock: "",
          dist: cfg.dist,
          auth3rd: 0,
          ver: ver.ver
        });
      }
    });

    this.lineupLogin = 2;
  } else {
    if (this.loginType == Const.ACCOUNT_TYPE.CHARGE) {
      // 充值
      this.sendCmd("CMD_L_START_RECHARGE", {
        account: this.account,
        chargeType: Math.ceil(Math.random() * 6)
      });
    } else if (this.loginType == Const.ACCOUNT_TYPE.INSIDER) {
      // 购买会员
      this.sendCmd("CMD_L_START_BUY_INSIDER", {
        account: this.account,
        type: Math.ceil(Math.random() * 3)
      });
    }
  }
};

Client.prototype.onLineUpDisConnected = function(msg, msgData) {
  if (msgData.result != "end") {
    // 重启
    this.restartWaitLine();
    return;
  }

  if (this.lineupLogin == 1) {
    this.login(this.loginType);
  } else if (this.lineupLogin == 2) {
  } else {
    // 重启
    this.restartWaitLine();
  }
};

Client.prototype.onLineUpStartLogin = function(msg, msgData) {
  // 重连
  this.cookie = msgData.cookie;
  this.lineupLogin = 1;
};

Client.prototype.restartWaitLine = function() {
  // 过一段时间重新开启
  var that = this;
  setTimeout(function() {
    waitLineAction(that.account, that.loginType);
  }, 1);
};

Client.prototype.onDialogOk = function(msg, data) {
  this.trace("dialog ok : " + data.msg);

  this.me.onDialogOk(data);
};

Client.prototype.onNotifyMiscEx = function(msg, data) {
  this.trace("MSG_NOTIFY_MISC_EX : " + data.msg);

  this.me.onNotifyMiscEx(data);
};

Client.prototype.onOtherLogin = function(msg, data) {
  this.trace("other login : " + data.msg);
};

Client.prototype.onAccountInOtherServer = function(msg, data) {
  this.trace("accout in other server : " + data.msg);
  var infos = data.msg.split(",");
  this.connectAAA = true;
  this.gs = infos[0];
  this.gsPort = infos[1];

  // 如果是重连
  if (data.result) {
    var arrUint32 = new Uint32Array([infos[2], infos[3]]);
    this.authKey = arrUint32[0];
    this.seed = arrUint32[1];
    this.connection.end();
    this.trace("onAccountInOtherServer.end");
    this.loginAAAStep = 4;
    this.gs = infos[0];
    this.gsPort = infos[1];
  }
};

module.exports = {
  create: function(connectType) {
    if (Const.CONNECT_TYPE.NORMAL != connectType && Const.CONNECT_TYPE.LINE_UP != connectType) {
      // 默认为正常连接
      connectType = Const.CONNECT_TYPE.NORMAL;
    }

    return new Client(connectType);
  }
};
