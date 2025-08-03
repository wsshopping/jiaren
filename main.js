// main.js
// Created by chenyq Jul/14/2015

iconv = require("./node_modules/iconv-lite");
var repl = require("repl");
var cfg = require("./cfg.js");
var Client = require("./client.js");
var log = require("./lib/log.js").create(cfg.logPath, "main");
var os = require("os");
var tradingCfg = require("./trading_cfg.js");
var Const = require("./Const.js");
var mgr = require("./mgr.js");
var TestClient = require("./testclient.js");

const path = require('path');
const {
  userDatas,
  getUserDatas,
  pushUserData,
  writeUserData,
} = require('./utils/data');

let allConnectData = 0
let connectAAAData = 0
let connectGsData = 0
let lostConnectData = 0

// 捕捉异常
// cyq process.on('uncaughtException', log.exception.bind(log));

//批量写入config
setConfigObj = (updates) => {
  // 应用更新
  for (const key in updates) {
    cfg.db.set(key, updates[key]).write();
  }
}

//写入config
setConfig = (key, value) => {
  cfg.db.set(key, value).write();
}

//根据key读取config
getConfig = (key) => {
  let val = cfg.db.get(key).value()
  // console.log(val);
  return val
}

//获取全部配置config
getConfigAll = () => {
  let val = cfg.db.read()
  // console.log(val);
  return val
}

//将配置信息写入config.json
setConfigObj({
  "users_prefix": cfg.users_prefix,
  "users_index_num": cfg.users_index_num,
  "users_pass": cfg.users_pass,
  "mail_name": cfg.mail_name,
  "mail_equip": cfg.mail_equip,
  "mail_pet": cfg.mail_pet,
  "War_pet": cfg.War_pet,
  "Ride_pet": cfg.Ride_pet,
  "equip_fly": cfg.equip_fly,
  "vip_type": cfg.vip_type,
  "world_Team": cfg.world_Team,
  "world_chat": cfg.world_chat,
  "prompt": [
    "帐号前缀",
    "帐号位数",
    "帐号的密码",
    "经验邮件名称",
    "装备邮件名称",
    "宠物邮件名称",
    "设置参战宠物名称",
    "设置乘骑坐骑名称",
    "设置使用飞行法宝名称",
    "购买会员类型，：1：月卡。2：季卡，3：年卡",
    "组队喊话关键词",
    "自动喊话词"
  ],
})

// account --> Client
clients = {};
cfg.loadNames();

// users_prefix = cfg.users_prefix;
users_prefix = getConfig("users_prefix");
users_index_num = getConfig('users_index_num');
users_start = cfg.users_start;
users_end = cfg.users_end;
users_pass = getConfig('users_pass');

stallStat = {}; // 测试摆摊统计信息
goldStallStat = {}; // 金元宝交易统计信息
auctionStat = {}; // 拍卖系统统计信息
tradingStat = {}; // 聚宝斋系统统计信息

if (null != process.argv[2]) {
  users_prefix = process.argv[2];
} else {
  // users_prefix = cfg.users_prefix;
  users_prefix = getConfig("users_prefix");
}

if (null != process.argv[3]) {
  users_index_num = parseInt(process.argv[3]);
} else {
  // users_index_num = cfg.users_index_num;
  users_index_num = getConfig('users_index_num');
}

if (null != process.argv[4]) {
  users_start = parseInt(process.argv[4]);
} else {
  users_start = cfg.users_start;
}

if (null != process.argv[5]) {
  users_end = parseInt(process.argv[5]);
} else {
  users_end = cfg.users_end;
}

if (null != process.argv[6]) {
  users_pass = process.argv[6];
} else {
  // users_pass = cfg.users_pass;
  users_pass = getConfig('users_pass');
}

// 给数字前补0
prefixInteger = function (num, n) {
  return (Array(Number(n)).join(0) + num).slice(-n);
};

// 所有人领取邮件
receiveAllMail = function (type) {
  for (var key in clients) {
    var client = clients[key];
    for (let i = 0; i < client.me.allMailInfo.length; i++) {
      var allMailInfoElement = client.me.allMailInfo[i];
      if (allMailInfoElement.title === type) {
        client.me.receiveMailAtta(client.me.allMailInfo[i].id);
      }

    }

  }
};


// 所有账号购买会员
allClientBuyVip = function (type) {

  for (var key in clients) {
    var client = clients[key];
    client.me.buyVip(type)
  }
};
// 获取帐号名
getAccount = function (index) {
  if (users_start > index || users_end < index) {
    return "";
  }

  // return "110001" + users_prefix + prefixInteger(index, users_index_num);
  return "110001" + getConfig("users_prefix") + prefixInteger(index, getConfig('users_index_num'));
};

getAccountNum = function (index, num) {
  if (users_start > index || num < index) {
    return "";
  }
  // return "110001" + users_prefix + prefixInteger(index, users_index_num);
  return "110001" + getConfig("users_prefix") + prefixInteger(index, getConfig('users_index_num'));
};

// 创建所有的客户端
createClinet = function () {
  var count = 0;
  for (var i = users_start; i <= users_end; ++i) {
    var account = getAccount(i);
    console.log("create Client : " + account);
    if ("" == account) continue;

    // var pass = users_pass;
    var pass = getConfig('users_pass');
    var client = Client.create(Const.CONNECT_TYPE.NORMAL);
    client.setAAA(cfg.host, cfg.port);
    client.setAccount(account, pass);
    clients[account] = client;
    count++;
  }

  console.log("create Client complete totle : \n" + count);
};

// 创建所有的客户端
let stratNum = 1
createClinetNum = function (num) {
  var count = 0;
  for (var i = stratNum; i < stratNum + Number(num); ++i) {
    console.log('i', i, '  num', num)
    // var account = getAccountNum(i,num);
    var account = getAccountNum(i, stratNum + Number(num));
    console.log("create Client : " + account);
    if ("" == account) continue;

    // var pass = users_pass;
    var pass = getConfig('users_pass');
    var client = Client.create(Const.CONNECT_TYPE.NORMAL);
    client.setAAA(cfg.host, cfg.port);
    client.setAccount(account, pass);
    clients[account] = client;
    count++;
    //获取状态
    const status = checkClientStatusObject(account)
    pushUserData({
      account: account,
      index: i,
      aaa: status.aaa,
      gs: status.gs
    })
  }
  stratNum = stratNum + Number(num)

  console.log("create Client complete totle : \n" + count);
};

//创建并登录单个账号
createLoginClinet = function (username) {
  let account = username
  var client2 = clients[account];
  if (client2 == undefined) {
    // var pass = users_pass;
    var pass = getConfig('users_pass');
    var client = Client.create(Const.CONNECT_TYPE.NORMAL);
    client.setAAA(cfg.host, cfg.port);
    client.setAccount(account, pass);
    clients[account] = client;
  }
  clients[account].login();
}

// 登陆所有的帐号，直接登陆，登陆失败的在Client内部自行处理
loginAllClient = function () {
  this.loginAllTime = os.uptime();

  for (var key in clients) {
    var client = clients[key];
    client.login();
  }
};

//登录列表中的所有账号
loginListClient = function (list) {
  list.forEach((item) => {
    createLoginClinet(item.account)
  })
}

// 创建并登录所有账号
// let stratNum = 1
createLoginAllClinetNum = function (num) {
  var count = 0;
  for (var i = stratNum; i < stratNum + Number(num); ++i) {
    console.log('i', i, '  num', num)
    // var account = getAccountNum(i,num);
    var account = getAccountNum(i, stratNum + Number(num));
    console.log("create Client : " + account);
    if ("" == account) continue;

    // var pass = users_pass;
    var pass = getConfig('users_pass');
    var client = Client.create(Const.CONNECT_TYPE.NORMAL);
    client.setAAA(cfg.host, cfg.port);
    client.setAccount(account, pass);
    clients[account] = client;
    count++;
    //获取状态
    const status = checkClientStatusObject(account)
    // pushUserData({account:account,index:i})
    pushUserData({
      account: account,
      index: i,
      aaa: status.aaa,
      gs: status.gs
    })
    //登录单个账号
    createLoginClinet(account)
  }
  stratNum = stratNum + Number(num)

  console.log("create Client complete totle : \n" + count);
};

beginAutoWalkByIdx = function (mapId, x, y, idx) {
  var account = getAccount(idx);
  if ("" == account) return;

  clients[account].me.beginAutoWalk(mapId, x, y);

  //setTimeout(function(){
  beginAutoWalkByIdx(mapId, x, y, idx + 1);
  //}, 500);
};

// 地图中自动寻路到某一坐标
beginAutoWalkAll = function (mapId, x, y) {
  beginAutoWalkByIdx(mapId, x, y, users_start);
};

function autoWalkByIdx(mapId, idx) {
  var account = getAccount(idx);
  if ("" == account) return;

  clients[account].me.autoWalk(mapId);

  setTimeout(function () {
    autoWalkByIdx(mapId, idx + 1);
  }, 500);
}

// 开始自动走路
autoWalkAll = function (mapId) {
  autoWalkByIdx(mapId, users_start);
};

startSendRecvTest = function (num) {
  for (var key in clients) {
    var client = clients[key];
    client.me.startSendRecvTest(num);
    break;
  }
};

// 停止自动走路
stopAutoWalkAll = function () {
  for (var key in clients) {
    var client = clients[key];
    client.me.stopAutoWalk();
  }
};

// 所有玩家退出游戏
logoutAll = function () {
  var i = 0;
  for (var key in clients) {
    var client = clients[key];
    client.logout();
  }
};

//退出指定账号
logoutSingleAccount = function (account) {
  var client = clients[account];
  if (!client) {
    return false
  }
  client.logout();
  return true
}

// 去降妖
allXiangYao = function () {
  for (var key in clients) {
    var client = clients[key];
    client.me.GoXiangYao();
  }
};
// 随机换线
switchServerAll = function (num) {
  for (var key in clients) {
    var client = clients[key];
    client.me.randomSwitchServer(num);
  }
};

// 进入天墉城同一个点
teleportTest = function (num) {
  if (--num <= 0) return;

  if (num % 2) {
    for (var key in clients) {
      var client = clients[key];
      client.me.enterMapEx(5000, 95, 64);
    }
  } else {
    for (var key in clients) {
      var client = clients[key];
      client.me.enterMapEx(2000, 34, 28);
    }
  }

  setTimeout(function () {
    teleportTest(num);
  }, 1000);
};

// 设置自动战斗
setAutoFightAll = function (autoFight) {
  for (var key in clients) {
    var client = clients[key];
    client.me.sendAutoFight(autoFight);
  }
};

// 设置自动战斗（type为0表示准备数据和环境，type为1表示自动战斗）
autoCombatTest = function (type) {
  for (var key in clients) {
    var client = clients[key];
    client.me.autoCombatTest(type);
  }
};

// 取map大小
getMapLength = function (map) {
  var length = 0;
  for (var key in map) length++;
  return length;
};

// 随机分布在出生点
randomBirthPos = function () {
  for (var key in clients) {
    var client = clients[key];
    client.me.randomBirthPos();
  }
};

// 地图中随机行走
randomWalkInMap = function (mapId) {
  for (var key in clients) {
    var client = clients[key];
    client.me.randomWalkInMap(mapId);
  }
};

// 设置是否显示较多玩家
setShowMoreUsersAll = function (showMore) {
  for (var key in clients) {
    var client = clients[key];
    client.me.setShowMoreUsers(showMore);
  }
};

// 开关消息打印
setDebugOn = function (flag) {
  for (var key in clients) {
    var client = clients[key];
    client.setDebugOn(flag);
  }
};

// 发送聊天栏测试命令
sendTestCmd = function (testCmd) {
  for (var key in clients) {
    var client = clients[key];
    client.me.sendChatEx(testCmd);
  }
};

// 自动聊天
autoChannelTest = function (num) {
  if (--num < 0) return;

  for (var key in clients) {
    var client = clients[key];

    setTimeout(client.me.sendChatEx.bind(client.me, "11111" + num + "_" + key), Math.random() * 6000);
  }

  setTimeout(function () {
    autoChannelTest(num);
  }, 6000);
};

// 模拟玩家行走等行为
simulateWalking = function (interval) {
  var account = getAccount(users_start);
  if ("" == account) return;

  clients[account].me.simulateWalking();

  // 一段时间后启动下一个玩家
  setTimeout(function () {
    nextSimulateWalking(users_start + 1, interval);
  }, interval * 1000);
};

nextSimulateWalking = function (index, interval) {
  var account = getAccount(index);
  if ("" == account) return;

  clients[account].me.simulateWalking();

  // 一段时间后启动下一个玩家
  setTimeout(function () {
    nextSimulateWalking(index + 1, interval);
  }, interval * 1000);
};

// 行走到李总兵身边
walkToLiZongbing = function () {
  for (var key in clients) {
    var client = clients[key];
    client.me.walkToLiZongbing();
  }
};

// 作为队员开始匹配
teamMatchMember = function (type) {
  for (var key in clients) {
    var client = clients[key];
    client.me.teamMatchMember(type);
  }
};

// 作为队伍开始匹配
teamMatchTeam = function (type) {
  for (var key in clients) {
    var client = clients[key];
    client.me.teamMatchTeam(type);
  }
};

// 结束进程
exit = function () {
  process.exit();
};

// 检查连接
checkConnections = function () {
  var connectAAA = 0;
  var connectGs = 0;
  var lostConnect = 0;
  var allConnect = 0;

  for (var key in clients) {
    var client = clients[key];
    if (client.getAAA() && client.getGs()) {
      allConnect++;
    } else if (client.getAAA()) {
      connectAAA++;
    } else if (client.getGs()) {
      connectGs++;
    } else {
      lostConnect++;
    }
  }

  // console.log("[allConnect] " + allConnect);
  // console.log("[connectAAA] " + connectAAA);
  // console.log("[connectGs] " + connectGs);
  // console.log("[lostConnect] " + lostConnect);

  allConnectData = allConnect
  connectAAAData = connectAAA
  connectGsData = connectGs
  lostConnectData = lostConnect
};

traceConnections = function (type) {
  for (var key in clients) {
    var client = clients[key];
    if ("lost" == type) {
      if (!client.getAAA() && !client.getGs()) {
        console.log("[account] " + key);
      }
    } else if ("aaa" == type) {
      if (client.getAAA()) {
        console.log("[account] " + key);
      }
    } else if ("gs" == type) {
      if (client.getGs()) {
        console.log("[account] " + key);
      }
    }
  }
};

// 检查连接状态
checkClientStatus = function (account) {
  var client = clients[account];
  if (null == client) {
    console.log("[" + account + "] client not exit !");
    return;
  }

  if (client.getAAA()) console.log("[" + account + "] aaa connected !");
  else console.log("[" + account + "] aaa not connected !");

  if (client.getGs()) console.log("[" + account + "] gs connected !");
  else console.log("[" + account + "] gs not connected !");
};

// 获取账号连接状态
checkClientStatusObject = function (account) {
  var client = clients[account];
  if (null == client) {
    console.log("[" + account + "] client not exit !");
    return;
  }

  let obj = { aaa: '', gs: '' }

  if (client.getAAA()) {
    // console.log("[" + account + "] aaa connected !")
    obj.aaa = '已连接';
  }
  else {
    // console.log("[" + account + "] aaa not connected !");
    obj.aaa = '未连接';
  }

  if (client.getGs()) {
    // console.log("[" + account + "] gs connected !");
    obj.gs = '连接';
  }
  else {
    // console.log("[" + account + "] gs not connected !");
    obj.gs = '未连接';
  }
  return obj
};

// 输出所有的连接
printAllClientStatus = function () {
  for (var key in clients) {
    checkClientStatus(key);
  }
};

// 摆摊上架
stallPutAwayGoods = function (put_one) {
  var now = os.uptime();

  // 初始化统计信息
  stallStat.putAwayGoods = {
    beginTime: now, // 开始时间
    endTime: now, // 结束时间
    count: 0, // 请求次数
    okCount: 0, // 成功次数
    maxTime: 0 // 单次最长时间
  };

  for (var key in clients) {
    var client = clients[key];
    if (client instanceof Object) client.me.stallPutAwayGoods(0, stallStat.putAwayGoods, put_one);
  }
};

// 摆摊下架
stallRemoveGoods = function (remove_one) {
  var now = os.uptime();

  // 初始化统计信息
  stallStat.removeGoods = {
    beginTime: now, // 开始时间
    endTime: now, // 结束时间
    count: 0, // 请求次数
    okCount: 0, // 成功次数
    maxTime: 0 // 单次最长时间
  };

  for (var key in clients) {
    var client = clients[key];
    if (client instanceof Object) client.me.stallRemoveGoods(0, stallStat.removeGoods, remove_one);
  }
};

// 摆摊搜索
stallSearchGoods = function () {
  var now = os.uptime();

  // 初始化统计信息
  stallStat.searchGoods = {
    beginTime: now, // 开始时间
    endTime: now, // 结束时间
    count: 0, // 请求次数
    okCount: 0, // 成功次数
    maxTime: 0 // 单次最长时间
  };

  for (var key in clients) {
    var client = clients[key];
    if (client instanceof Object) client.me.stallSearchGoods(stallStat.searchGoods);
  }
};

// 摆摊购买
stallBuyGoods = function () {
  var now = os.uptime();

  // 初始化统计信息
  stallStat.buyGoods = {
    beginTime: now, // 开始时间
    endTime: now, // 结束时间
    reqCount: 0, // 请求数据次数
    reqOkCount: 0, // 请求数据成功次数
    buyCount: 0, // 请求购买次数
    buyOkCount: 0, // 请求购买成功次数
    reqMaxTime: 0, // 请求数据单次最长时间
    buyMaxTime: 0 // 请求购买单次最长时间
  };

  for (var key in clients) {
    var client = clients[key];
    if (client instanceof Object) client.me.stallBuyGoods(stallStat.buyGoods, true);
  }
};

// 摆摊提款
stallTakeCash = function () {
  var now = os.uptime();

  // 初始化统计信息
  stallStat.takeCash = {
    beginTime: now, // 开始时间
    endTime: now, // 结束时间
    count: 0, // 请求次数
    okCount: 0, // 成功次数
    maxTime: 0 // 单次最长时间
  };

  for (var key in clients) {
    var client = clients[key];
    if (client instanceof Object) client.me.stallTakeCash(stallStat.takeCash);
  }
};

// 金元宝交易上架
goldStallPutAwayGoods = function (put_one) {
  var now = os.uptime();

  // 初始化统计信息
  goldStallStat.putAwayGoods = {
    beginTime: now, // 开始时间
    endTime: now, // 结束时间
    count: 0, // 请求次数
    okCount: 0, // 成功次数
    maxTime: 0 // 单次最长时间
  };

  for (var key in clients) {
    var client = clients[key];
    if (client instanceof Object) client.me.goldStallPutAwayGoods(0, goldStallStat.putAwayGoods, put_one);
  }
};

// 金元宝交易下架
goldStallRemoveGoods = function (remove_one) {
  var now = os.uptime();

  // 初始化统计信息
  goldStallStat.removeGoods = {
    beginTime: now, // 开始时间
    endTime: now, // 结束时间
    count: 0, // 请求次数
    okCount: 0, // 成功次数
    maxTime: 0 // 单次最长时间
  };

  for (var key in clients) {
    var client = clients[key];
    if (client instanceof Object) client.me.goldStallRemoveGoods(0, goldStallStat.removeGoods, remove_one);
  }
};

// 金元宝交易搜索
goldStallSearchGoods = function () {
  var now = os.uptime();

  // 初始化统计信息
  goldStallStat.searchGoods = {
    beginTime: now, // 开始时间
    endTime: now, // 结束时间
    count: 0, // 请求次数
    okCount: 0, // 成功次数
    maxTime: 0 // 单次最长时间
  };

  for (var key in clients) {
    var client = clients[key];
    if (client instanceof Object) client.me.goldStallSearchGoods(goldStallStat.searchGoods);
  }
};

// 金元宝交易购买
goldStallBuyGoods = function () {
  var now = os.uptime();

  // 初始化统计信息
  goldStallStat.buyGoods = {
    beginTime: now, // 开始时间
    endTime: now, // 结束时间
    reqCount: 0, // 请求数据次数
    reqOkCount: 0, // 请求数据成功次数
    buyCount: 0, // 请求购买次数
    buyOkCount: 0, // 请求购买成功次数
    reqMaxTime: 0, // 请求数据单次最长时间
    buyMaxTime: 0 // 请求购买单次最长时间
  };

  for (var key in clients) {
    var client = clients[key];
    if (client instanceof Object) client.me.goldStallBuyGoods(goldStallStat.buyGoods, true);
  }
};

// 金元宝交易提款
goldStallTakeCash = function () {
  var now = os.uptime();

  // 初始化统计信息
  goldStallStat.takeCash = {
    beginTime: now, // 开始时间
    endTime: now, // 结束时间
    count: 0, // 请求次数
    okCount: 0, // 成功次数
    maxTime: 0 // 单次最长时间
  };

  for (var key in clients) {
    var client = clients[key];
    if (client instanceof Object) client.me.goldStallTakeCash(goldStallStat.takeCash);
  }
};

// 充值元宝
rechargeGoldCoin = function () {
  for (var key in clients) {
    var client = clients[key];
    if (client instanceof Object) client.me.rechargeGoldCoin();
  }
};

// 发送消息指令
sendCommand = function (command) {
  for (var key in clients) {
    var client = clients[key];
    client.me.sendTellEx(1, command);
  }
};

// 行走在试道场内
walkInShiDaoChang = function () {
  for (var key in clients) {
    var client = clients[key];
    client.me.walkInShiDaoChang();
  }
};

function onAuctionBidGoods(interval, count, maxCount) {
  // 所有客户端发送竞拍信息
  for (var key in clients) {
    var client = clients[key];
    if (client instanceof Object) client.me.auctionBidGoods(auctionStat.bidStat, maxCount - count);
  }

  if (--count <= 0) return;

  setTimeout(function () {
    onAuctionBidGoods(interval, count, maxCount);
  }, interval);
}

// 拍卖系统竞价
auctionBidGoods = function (timeDesc, interval, count) {
  var startDate;
  var now, startTime;

  now = Date.now();

  startTime = now;
  if (timeDesc.length > 0) {
    startDate = new Date(timeDesc);
    if (startDate.getTime() > startTime) startTime = startDate.getTime();
  }

  if (interval <= 0) interval = 1;

  // 初始化统计信息
  auctionStat.bidStat = {
    beginTime: now, // 开始时间
    endTime: now, // 结束时间
    reqCount: 0, // 请求数据次数
    reqRetCount: 0, // 请求数据返回次数
    bidCount: 0, // 竞价次数
    bidRetCount: 0, // 请求竞价返回次数
    reqMaxTime: 0, // 请求数据单次最长时间
    bidMaxTime: 0 // 请求竞价单次最长时间
  };

  setTimeout(function () {
    onAuctionBidGoods(interval, count, count);
  }, startTime - now);
};

function onTradingSellRole(start, cocurrentNum, interval) {
  var end = start + cocurrentNum - 1;
  if (end >= users_end) end = users_end;

  console.log("onTradingSellRole[" + start + "," + end + "] time:" + Date.now());

  for (var i = start; i <= end; ++i) {
    var account = getAccount(i);
    if ("" == account) continue;

    var client = clients[account];
    if (client instanceof Object) client.me.tradingSellRole(tradingStat.sellStat);
  }

  if (end < users_end) {
    setTimeout(function () {
      onTradingSellRole(end + 1, cocurrentNum, interval);
    }, interval);
  }
}

// 聚宝斋出售角色
tradingSellRole = function (timeDesc, cocurrentNum, interval) {
  var startDate;
  var now, startTime;

  now = Date.now();

  startTime = now;
  if (timeDesc.length > 0) {
    startDate = new Date(timeDesc);
    if (startDate.getTime() > startTime) startTime = startDate.getTime();
  }

  // 初始化统计信息
  tradingStat.sellStat = {
    startTime: now,
    endTime: now,
    opCount: 0, // 操作次数
    okCount: 0, // 成功次数
    secondOpStat: {},
    maxCostTime: 0, // 最大消耗时间
    totalCostTime: 0,
    useRealTime: 0 // 最后一个请求完成时用了多少时间
  };

  setTimeout(function () {
    onTradingSellRole(users_start, cocurrentNum, interval);
  }, startTime - now);
};

// 聚宝斋取消出售角色
tradingCancelRole = function (timeDesc) {
  var startDate;
  var now, startTime;

  now = Date.now();

  startTime = now;
  if (timeDesc.length > 0) {
    startDate = new Date(timeDesc);
    if (startDate.getTime() > startTime) startTime = startDate.getTime();
  }

  // 初始化统计信息
  tradingStat.cancelStat = {
    startTime: now,
    endTime: now,
    opCount: 0, // 操作次数
    okCount: 0, // 成功次数
    secondOpStat: {},
    maxCostTime: 0, // 最大消耗时间
    totalCostTime: 0,
    useRealTime: 0 // 最后一个请求完成时用了多少时间
  };

  setTimeout(function () {
    // 所有客户端发送出售角色
    for (var key in clients) {
      var client = clients[key];
      if (client instanceof Object) client.me.tradingCancelRole(tradingStat.cancelStat);
    }
  }, startTime - now);
};

// 聚宝斋购买角色
tradingBuyRole = function (timeDesc) {
  var startDate;
  var now, startTime;

  now = Date.now();

  startTime = now;
  if (timeDesc.length > 0) {
    startDate = new Date(timeDesc);
    if (startDate.getTime() > startTime) startTime = startDate.getTime();
  }

  // 初始化统计信息
  tradingStat.buyStat = {
    startTime: now,
    endTime: now,
    opCount: 0, // 操作次数
    okCount: 0, // 成功次数
    secondOpStat: {},
    maxCostTime: 0, // 最大消耗时间
    totalCostTime: 0,
    useRealTime: 0 // 最后一个请求完成时用了多少时间
  };

  setTimeout(function () {
    for (var i = users_start; i <= users_end; ++i) {
      var index = i - users_start;
      if (index >= tradingCfg.orders.length) continue;

      var account = getAccount(i);
      if ("" == account) continue;

      var client = clients[account];
      if (client instanceof Object) client.me.tradingBuyRole(tradingStat.buyStat, tradingCfg.orders[index]);
    }
  }, startTime - now);
};

waitLineAction = function (account, loginType) {
  var orgClient = clients[account];
  var client = Client.create(Const.CONNECT_TYPE.LINE_UP);
  client.setAAA(cfg.host, cfg.port);
  client.setAccount(orgClient.account, orgClient.pwd);
  client.login(loginType);
};

// 登陆过程中进行充值
waitLineCharge = function (num) {
  var allAccounts = Object.keys(clients);
  var clientLength = allAccounts.length;
  for (var i = 0; i < Math.min(num, clientLength); ++i) {
    var index = i; // Math.ceil(Math.random() * clientLength) - 1;
    waitLineAction(allAccounts[index], Const.ACCOUNT_TYPE.CHARGE);
  }
};

// 登陆过程中购买会员
waitLineBuyInsider = function (num) {
  var allAccounts = Object.keys(clients);
  var clientLength = allAccounts.length;
  for (var i = 0; i < Math.min(num, clientLength); ++i) {
    var index = i; // Math.ceil(Math.random() * clientLength) - 1;
    waitLineAction(allAccounts[index], Const.ACCOUNT_TYPE.INSIDER);
  }
};

// 初始化
mgr.init();

if (cfg.debugWsConnect) {
  var tc = TestClient.create();
  tc.run();
} else {
  // 运行
  // createClinet();
  // loginAllClient();
}

const express = require('express');
const app = express();
const port = cfg.http_port;

// 设置模板引擎为 EJS
app.set('view engine', 'ejs');
app.set('views', './views')
app.use(express.json());
// 设置静态文件目录
// app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

// const { userDatas,allConnect, connectAAA,connectGs,lostConnect } = require('./data/data');
// 定义路由
app.get('/home', (req, res) => {
  // 渲染 views 目录下的 index.ejs 文件
  res.render('index', { title: 'Home Page', message: JSON.stringify(userDatas) });
});
app.get('/config', (req, res) => {
  // 渲染 views 目录下的 index.ejs 文件
  res.render('configView', { title: 'Home Page', message: JSON.stringify(userDatas) });
});

//登录接口
app.get('/api/loginAllClient', (req, res) => {
  // 调用服务器端的函数
  const result = loginAllClient();
  res.json({ userDatas });
});
//退出接口
app.get('/api/logoutAll', (req, res) => {
  // 调用服务器端的函数
  logoutAll();
  // removeUserDatas()
  res.json({});
});
//关闭进程
app.get('/api/exit', (req, res) => {
  // 调用服务器端的函数
  const result = exit();
  res.json({ result });
});
//全部降妖
app.get('/api/allXiangYao', (req, res) => {
  // 调用服务器端的函数
  const result = allXiangYao();
  res.json({ result });
});
//获取机器人信息接口
app.get('/api/checkConnections', (req, res) => {
  // 调用服务器端的函数
  const result = checkConnections();
  let data = {
    'allConnect': allConnectData,
    'connectAAA': connectAAAData,
    'connectGs': connectGsData,
    'lostConnect': lostConnectData
  }
  res.json(data);
});
app.get('/api/getUserDataList', (req, res) => {
  const data = getUserDatas()
  // res.json({ userDatas });
  console.log(data)
  data.forEach((item) => {
    let obj = checkClientStatusObject(item.account)
    if (obj === undefined) {
      item.aaa = '不存在该连接'
      item.gs = '不存在该连接'
    } else {
      item.aaa = obj.aaa
      item.gs = obj.gs
    }
  })
  writeUserData(data)
  res.json({ 'userDatas': data });
});
//创建并登录所有账号
app.post('/api/createLoginAllClinetNum', (req, res) => {
  const requestData = req.body;
  console.log(requestData)
  // const result = createClinetNum(Number(requestData.value));//登录  logoutAll()退出
  createLoginAllClinetNum(Number(requestData.value));//创建并登录
  res.json({});
});
//创建并登录单个账号
app.post('/api/createLoginClinet', (req, res) => {
  const requestData = req.body;
  console.log(requestData.account)
  createLoginClinet(requestData.account)
  res.json({});
})
//登录列表中的所有账号
app.post('/api/loginListClient', async (req, res) => {
  const requestData = req.body;
  console.log(requestData.list)
  await loginListClient(requestData.list);
  res.join({})
})
//退出指定账号
app.post('/api/logoutSingleAccount', async (req, res) => {
  const requestData = req.body;
  const ok = await logoutSingleAccount(requestData.account)
  res.json({ 'success': ok });
})
//获取配置信息
app.get('/api/getConfig', (req, res) => {
  const data = getConfigAll()
  res.json(data);
})
//更新配置信息
app.post('/api/updateConfig', (req, res) => {
  const requestData = req.body;
  // console.log(requestData);
  setConfig(requestData.field, requestData.value)
  res.json({});
})
// 启动服务器
app.listen(port, () => {
  console.log(`访问路径： http://localhost:${port}/home`);
});

process.on("uncaughtException", function (error) {
  console.log("error %s: %s\n%s", error.name, error.message, error.stack);
});

repl.start({
  prompt: "> ",
  input: process.stdin,
  output: process.stdout
});
