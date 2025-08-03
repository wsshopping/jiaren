// me.js
// Created by chenyq Jul/29/2015
// 玩家 Me 类

var os = require("os");
var cfg = require("./cfg.js");
var GenNo = require("./comm/GeneralNotify.js");
var crypt = require("crypto");
var http = require("http");
var Obstacle = require("./Obstacle.js");
var AutoWalk = require("./AutoWalk.js");
var Instruction = require("./Instruction.js");
var Const = require("./Const.js");
var MapInfo = require("./MapInfo.js");
var mgr = require("./mgr.js");

var SEND_MOVE_CMD_INTERVAL = 1000;
var MAX_MOVE_STEP = 10;

//根据key读取config
getConfig = (key) => {
  let val = cfg.db.get(key).value()
  console.log(val);
  return val
}
function Me(connection) {
  if (!(this instanceof Me)) return new Me(connection);

  this.data = {};
  this.appearData = {}; // 出现在视野内的其他对象
  this.taskData = {}; // 任务数据
  this.teamData = {}; // 队伍数据
  this.teamMatchData = {}; // 队伍匹配数据
  this.moveCmds = [];
  this.inCombat = false;
  this.autoWalking = false;
  this.pets = {}; // 宠物
  this.items = {}; // 道具
  this.stallInfo = {}; // 玩家的摆摊信息
  this.stallStat = {}; // 摆摊统计信息
  this.goldStallInfo = {}; // 玩家的金元宝交易信息
  this.goldStallStat = {}; // 金元宝交易统计信息
  this.auctionStat = {}; // 拍卖统计信息
  this.tradingStat = {}; // 寄售统计信息
  this.allMailInfo = [];
  this.code = "";

  this.obstacle = Obstacle.create(this.connection);
  this.autoWalk = AutoWalk.create(this);
  this.instruction = Instruction.create(this);

  this.setCon(connection);

  this.createTime = os.uptime();
}

Me.prototype.setAccount = function(account) {
  this.account = account;
};

Me.prototype.setCon = function(connection) {
  this.con = connection;

  this.con.regCallback("MSG_UPDATE", this.onUpdate.bind(this));
  this.con.regCallback("MSG_EXECUTE_LUA_CODE", this.onExecLua.bind(this));
  this.con.regCallback("MSG_ENTER_GAME", this.onEnterGame.bind(this));
  this.con.regCallback("MSG_ENTER_ROOM", this.onEnterRoom.bind(this));
  this.con.regCallback("MSG_MOVED", this.onMoved.bind(this));
  this.con.regCallback("MSG_C_START_COMBAT", this.onStartCombat.bind(this));
  this.con.regCallback("MSG_C_END_COMBAT", this.onEndCombat.bind(this));
  this.con.regCallback("MSG_C_WAIT_COMMAND", this.onWaitCommand.bind(this));
  this.con.regCallback("MSG_UPDATE_PETS", this.onUpdatePets.bind(this));
  this.con.regCallback("MSG_SET_OWNER", this.onSetOwner.bind(this));
  this.con.regCallback("MSG_STALL_MINE", this.onStallMine.bind(this));
  this.con.regCallback("MSG_GOLD_STALL_MINE", this.onGoldStallMine.bind(this));
  this.con.regCallback("MSG_INVENTORY", this.onUpdateInventory.bind(this));
  this.con.regCallback("MSG_MARKET_SEARCH_RESULT", this.onStallSearchResult.bind(this));
  this.con.regCallback("MSG_GOLD_STALL_SEARCH_GOODS", this.onGoldStallSearchResult.bind(this));
  this.con.regCallback("MSG_STALL_ITEM_LIST", this.onStallItemList.bind(this));
  this.con.regCallback("MSG_GOLD_STALL_GOODS_LIST", this.onGoldStallItemList.bind(this));
  this.con.regCallback("MSG_CHARGE_INFO", this.onChargeInfo.bind(this));
  this.con.regCallback("MSG_GENERAL_NOTIFY", this.onGeneralNotify.bind(this));
  this.con.regCallback("MSG_SYS_AUCTION_GOODS_LIST", this.onSysAuctionGoodsList.bind(this));
  this.con.regCallback("MSG_SYS_AUCTION_UPDATE_GOODS", this.onSysAuctionGoodsUpdate.bind(this));
  this.con.regCallback("MSG_CONFIRM_DLG", this.onConfirmDlg.bind(this));
  this.con.regCallback("MSG_PLAY_SCENARIOD", this.onPlayScenariod.bind(this));
  this.con.regCallback("MSG_APPEAR", this.onAppear.bind(this));
  this.con.regCallback("MSG_DISAPPEAR", this.onDisAppear.bind(this));
  this.con.regCallback("MSG_MENU_LIST", this.onMenuList.bind(this));
  this.con.regCallback("MSG_TASK_PROMPT", this.onTaskPrompt.bind(this));
  this.con.regCallback("MSG_PLAY_INSTRUCTION", this.onPlayInstruction.bind(this));
  this.con.regCallback("MSG_GOODS_LIST", this.onGoodsList.bind(this));
  this.con.regCallback("MSG_OPEN_EXCHANGE_SHOP", this.onOpenExchangeShop.bind(this));
  this.con.regCallback("MSG_SUBMIT_PET", this.onSubmitPet.bind(this));
  this.con.regCallback("MSG_INSIDER_INFO", this.onInsiderInfo.bind(this));
  this.con.regCallback("MSG_UPDATE_TEAM_LIST", this.onUpdateTeamList.bind(this));
  this.con.regCallback("MSG_MATCH_TEAM_STATE", this.onMatchTeamState.bind(this));
  this.con.regCallback("MSG_MESSAGE_EX", this.onMessageEx.bind(this));
  this.con.regCallback("MSG_PARTY_LIST_EX", this.onPartyListEx.bind(this));
  this.con.regCallback("MSG_REQUEST_SERVER_STATUS", this.onRequestServerStatus.bind(this));
  this.con.regCallback("MSG_NOTIFY_SECURITY_CODE", this.onNotifySecurityCode.bind(this));
  this.con.regCallback("MSG_MAILBOX_REFRESH", this.receiveAllMail.bind(this));
};

Me.prototype.getTimeMs = function() {
  return Math.floor((os.uptime() - this.createTime) * 1000);
};

// 当前所在地图名称
Me.prototype.getCurrentMapName = function() {
  if (MapInfo[this.data.map_id]) return MapInfo[this.data.map_id]["map_name"];

  return;
};

// 获取师尊名称
Me.prototype.getFamilyBoss = function() {
  return Const.FAMILY_BOSS[this.data.polar];
};

// 发送消息
Me.prototype.sendCmd = function(cmd, data) {
  if (!this.con.getConnectGS()) return;

  this.con.sendCmd(cmd, data);
};

// 切换地图
Me.prototype.enterMap = function(mapId) {
  this.sendCmd("CMD_TELEPORT", {
    map_id: mapId,
    x: 0,
    y: 0
  });
};

// 切换地图
Me.prototype.enterMapEx = function(mapId, dst_x, dst_y) {
  this.sendCmd("CMD_TELEPORT", {
    map_id: mapId,
    x: dst_x,
    y: dst_y
  });
};

Me.prototype.convertToClientSpace = function(mapX, mapY) {
  return { x: mapX * Const.PANE_WIDTH + Const.PANE_WIDTH / 2, y: this.obstacle.getSceneHeight() - mapY * Const.PANE_HEIGHT - Const.PANE_HEIGHT / 2 };
};

Me.prototype.convertToMapSpace = function(x, y) {
  return { x: Math.floor(x / Const.PANE_WIDTH), y: Math.floor((this.obstacle.getSceneHeight() - y) / Const.PANE_HEIGHT) };
};

// 计算两点距离
Me.prototype.distance = function(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
};

Me.prototype.setEndPos = function(mapX, mapY) {
  if (!this.data.id || !mapX || !mapY) {
    return;
  }

  if (!this.data.map_id) {
    this.logWarning("[setEndPos]:还未收到过图数据 Me.data.map_id == null");
    return;
  }

  this.trace("[setEndPos]:map_id:" + this.data.map_id + ", x:" + mapX + ", y:" + mapY);
  if (this.obstacle.IsObstacle(mapX, mapY)) {
    this.logWarning("[setEndPos]:" + "(" + mapX + ", " + mapY + ") 在障碍点上");

    var pos = this.obstacle.GetNearestPos(mapX, mapY);

    if (0 != pos) {
      mapX = Math.floor(pos / 1000);
      mapY = pos % 1000;
    }
  }

  var cPos = this.convertToClientSpace(mapX, mapY);
  var endX = cPos.x;
  var endY = cPos.y;

  var x = this.data.x;
  var y = this.data.y;
  if (this.moveCmds.length > 0) {
    x = this.moveCmds[this.moveCmds.length - 1][0];
    y = this.moveCmds[this.moveCmds.length - 1][1];
  }
  var cPos = this.convertToClientSpace(x, y);
  var curX = cPos.x;
  var curY = cPos.y;

  // this.obstacle.FindPath 中是以原始大小进行计算的，所以需要进行换算
  var sceneH = this.obstacle.getSceneHeight();
  var rawBeginX = Math.floor(curX / Const.MAP_SCALE);
  var rawBeginY = Math.floor((sceneH - curY) / Const.MAP_SCALE);
  var rawEndX = Math.floor(endX / Const.MAP_SCALE);
  var rawEndY = Math.floor((sceneH - endY) / Const.MAP_SCALE);

  console.log("sceneH = "  + sceneH)
  console.log("rawBeginX = "  + rawBeginX)
  console.log("rawBeginY = "  + rawBeginY)
  console.log("rawEndX = "  + rawEndX)
  console.log("rawEndY = "  + rawEndY)
  var badpath = false;
  var paths = this.obstacle.FindPath(rawBeginX, rawBeginY, rawEndX, rawEndY);
  if (!paths) {
    this.trace("[setEndPos]:from:" + this.data.map_id + ", x:" + x + ", y:" + y);
    this.trace("[setEndPos]:to:" + this.data.map_id + ", x:" + mapX + ", y:" + mapY);
    return;
  }

  var count = paths.length;
  if (count > 1) {
    // 复制路径
    for (i = 1; i < count; i++) {
      var x = paths[i]["x" + i] * Const.MAP_SCALE;
      var y = sceneH - paths[i]["y" + i] * Const.MAP_SCALE;

      var mPos = this.convertToMapSpace(x, y);
      this.moveToX(mPos.x);
      this.moveToY(mPos.y);
    }
  }

  // 开始移动
  this.beginMove();
};

Me.prototype.clearWalkData = function() {
  this.moveCmds = [];
  clearTimeout(this.moveCmdTimer);
};

// 从 (curX, curY) 移到 (toX, curY)
Me.prototype.moveToX = function(toX) {
  var x = this.data.x;
  var y = this.data.y;

  if (this.moveCmds.length > 0) {
    x = this.moveCmds[this.moveCmds.length - 1][0];
    y = this.moveCmds[this.moveCmds.length - 1][1];
  }

  if (x == toX) {
    return;
  }

  if (x < toX) {
    for (x += 1; x <= toX; ++x) {
      this.moveCmds.push([Math.abs(x), y]);
    }
  } else {
    for (x -= 1; x >= toX; --x) {
      this.moveCmds.push([Math.abs(x), y]);
    }
  }
};

// 从 (curX, curY) 移到 (toX, curY)
Me.prototype.moveToX2 = function(x, y, moveCmds, toX) {
  if (moveCmds.length > 0) {
    x = moveCmds[moveCmds.length - 1][0];
    y = moveCmds[moveCmds.length - 1][1];
  }

  if (x == toX) {
    return;
  }

  if (x < toX) {
    for (x += 1; x <= toX; ++x) {
      moveCmds.push([Math.abs(x), y]);
    }
  } else {
    for (x -= 1; x >= toX; --x) {
      moveCmds.push([Math.abs(x), y]);
    }
  }
};

// 从 (curX, curY) 移到 (curX, toY)
Me.prototype.moveToY = function(toY) {
  var x = this.data.x;
  var y = this.data.y;

  if (this.moveCmds.length > 0) {
    x = this.moveCmds[this.moveCmds.length - 1][0];
    y = this.moveCmds[this.moveCmds.length - 1][1];
  }

  if (y == toY) {
    return;
  }

  if (y < toY) {
    for (y += 1; y <= toY; ++y) {
      this.moveCmds.push([x, Math.abs(y)]);
    }
  } else {
    for (y -= 1; y >= toY; --y) {
      this.moveCmds.push([x, Math.abs(y)]);
    }
  }
};

// 从 (curX, curY) 移到 (curX, toY)
Me.prototype.moveToY2 = function(x, y, moveCmds, toY) {
  if (moveCmds.length > 0) {
    x = moveCmds[moveCmds.length - 1][0];
    y = moveCmds[moveCmds.length - 1][1];
  }

  if (y == toY) {
    return;
  }

  if (y < toY) {
    for (y += 1; y <= toY; ++y) {
      moveCmds.push([x, Math.abs(y)]);
    }
  } else {
    for (y -= 1; y >= toY; --y) {
      moveCmds.push([x, Math.abs(y)]);
    }
  }
};
// 驱动队员移动
Me.prototype.teamMemberMove = function(info) {
  var member = this.teamData[this.data.id];

  if (!member || member.index != 0)
    // 自己不是队长
    return;

  member = this.teamData[info.id];
  if (!member)
    // 不是本队伍的队员
    return;

  var moveCmds = [];
  var endX = this.lastX ? this.lastX : this.data.x;
  var endY = this.lastY ? this.lastY : this.data.y;
  var cPos = this.convertToClientSpace(endX, endY);
  endX = cPos.x;
  endY = cPos.y;

  var x = info.x;
  var y = info.y;
  var cPos = this.convertToClientSpace(x, y);
  var curX = cPos.x;
  var curY = cPos.y;

  // this.obstacle.FindPath 中是以原始大小进行计算的，所以需要进行换算
  var sceneH = this.obstacle.getSceneHeight();
  var rawBeginX = Math.floor(curX / Const.MAP_SCALE);
  var rawBeginY = Math.floor((sceneH - curY) / Const.MAP_SCALE);
  var rawEndX = Math.floor(endX / Const.MAP_SCALE);
  var rawEndY = Math.floor((sceneH - endY) / Const.MAP_SCALE);

  var paths = this.obstacle.FindPath(rawBeginX, rawBeginY, rawEndX, rawEndY);
  if (!paths) {
    this.trace("[teamMemberMove]:from:" + this.data.map_id + ", x:" + x + ", y:" + y);
    this.trace("[teamMemberMove]:to:" + this.data.map_id + ", x:" + endX + ", y:" + endY);
    return;
  }

  var count = paths.length;
  if (count > 1) {
    // 复制路径
    for (i = 1; i < count; i++) {
      var x = paths[i]["x" + i] * Const.MAP_SCALE;
      var y = sceneH - paths[i]["y" + i] * Const.MAP_SCALE;

      var mPos = this.convertToMapSpace(x, y);
      this.moveToX2(info.x, info.y, moveCmds, mPos.x);
      this.moveToY2(info.x, info.y, moveCmds, mPos.y);
    }
  }

  // 开始移动
  if (moveCmds.length == 0) {
    return;
  }

  var num = MAX_MOVE_STEP;
  if (num > moveCmds.length) num = moveCmds.length;

  var data = {};
  data.id = info.id;
  data.map_id = this.data.map_id;
  data.map_index = this.data.map_index;
  data.count = num;
  for (var i = 0; i < num; ++i) {
    var pos = moveCmds.shift();
    data["x" + i] = pos[0];
    data["y" + i] = pos[1];
  }

  data.dir = this.data.dir;
  data.send_time = this.getTimeMs();
  this.con.sendCmd("CMD_OTHER_MOVE_TO", data);
};

// 移动到某点周围
Me.prototype.moveToAround = function(maxRandomAround) {
  var randomX = Math.floor(Math.random() * maxRandomAround + 1);
  var randomY = Math.floor(Math.random() * maxRandomAround + 1);
  if (Math.random() >= 0.5) randomX += this.data.x;
  else randomX = this.data.x - randomX;

  if (Math.random() >= 0.5) randomY += this.data.y;
  else randomY = this.data.y - randomY;

  // 设置目标点
  this.setEndPos(randomX, randomY);
};

// 停止自动走路
Me.prototype.stopAutoWalk = function() {
  this.stopWalk = true;

  this.isRandomWalkCfg = false;

  this.autoWalking = false;

  this.clearWalkData();
};

// 在试道场内行走
Me.prototype.walkInShiDaoChang = function() {
  var me = this;

  if (38004 != this.data.map_id) return;

  this.autoWalking = true;
  for (var i = 0; i < 400; ++i) {
    me.moveToAround(3);
  }
};

// 行走到李总兵身边
Me.prototype.walkToLiZongbing = function() {
  // 先飞到临时地图
  this.enterMap(cfg.tempMap);

  var me = this;
  setTimeout(function() {
    me.enterMap(cfg.lizongbingRoutes.mapId);
  }, 1300);

  setTimeout(function() {
    if (me.data.map_id != cfg.lizongbingRoutes.mapId) {
      return;
    }
    me.setEndPos(cfg.lizongbingRoutes.destPos[0], cfg.lizongbingRoutes.destPos[1]);
    me.moveToAround(8);
  }, 5000);
};

// 自动走路
Me.prototype.autoWalk = function(mapId) {
  if (!cfg.walkPath[mapId]) {
    console.log("[autoWalk]Not found walk path for map:", mapId);
    return;
  }

  this.autoWalking = true;
  this.enterMap(cfg.tempMap);
  this.enterMap(mapId);

  var me = this;
  setTimeout(function() {
    var path = cfg.walkPath[mapId];
    if (path[0].length > 0) {
      for (var i = 0; i < path[0].length; ++i) {
        var cmd = path[0][i];
        if (cmd.x) {
          me.moveToX(cmd.x);
        }

        if (cmd.y) {
          me.moveToY(cmd.y);
        }
      }
    }

    me.continueWalk();
  }, 500);
};

// 随机走一下，回到原点
Me.prototype.randomSomePosAndBack = function() {
  var x = this.data.x;
  var y = this.data.y;

  if (!this.obstacle.IsObstacle(x + 1, y)) {
    this.moveToX(x + 1);
  } else if (!this.obstacle.IsObstacle(x - 1, y)) {
    this.moveToX(x - 1);
  } else if (!this.obstacle.IsObstacle(x, y + 1)) {
    this.moveToY(y + 1);
  } else if (!this.obstacle.IsObstacle(x, y - 1)) {
    this.moveToY(y - 1);
  }

  this.moveCmds.push([x, y]);

  // 开始移动
  this.beginMove();
};

// 自动走路某一坐标
Me.prototype.beginAutoWalk = function(mapId, x, y) {
  if (this.data.map_id != mapId) {
    this.enterMap(mapId);
  }

  this.clearWalkData();

  var me = this;
  setTimeout(function() {
    if (me.data.map_id != mapId) {
      return;
    }

    me.setEndPos(x, y);
  }, 2000);
};

Me.prototype.continueWalk = function() {
  clearTimeout(this.moveCmdTimer);
  if (!this.autoWalking && !this.isRandomWalkCfg) {
    return;
  }

  if (this.data.map_id == 38004) {
    walkInShiDaoChang();
    return;
  }

  if (this.isRandomWalkCfg) {
    if (cfg.randomWalkRoutes[this.data.map_id]) {
      this.randomWalkMove(cfg.randomWalkRoutes[this.data.map_id].interval);
      return;
    } else {
      this.isRandomWalkCfg = false;
    }
  }

  var path = cfg.walkPath[this.data.map_id];
  if (!path || path[1].length == 0) {
    this.autoWalking = false;
    console.log("[continueWalk] Not found walk path for map:", this.data.map_id);
    return;
  }

  for (var i = 0; i < path[1].length; ++i) {
    var cmd = path[1][i];
    if (cmd.x) {
      this.moveToX(cmd.x);
    }

    if (cmd.y) {
      this.moveToY(cmd.y);
    }
  }

  // 开始移动
  this.beginMove();
};

// 设置是否开启自动战斗
Me.prototype.sendAutoFight = function(autoFight) {
  if (autoFight) this.autoFight = 1;
  else this.autoFight = 0;

  this.con.sendCmd("CMD_GENERAL_NOTIFY", {
    type: GenNo.NOTIFY_START_AUTO_FIGHT,
    para1: "" + this.autoFight,
    para2: ""
  });
};

Me.prototype.autoCombatTest = function(type) {
  // 准备战斗
  if (type == 0) this.sendChatEx("auto_combat_test 0");
  else this.sendChatEx("auto_combat_test 1");
};

Me.prototype.sendChatEx = function(message) {
  this.con.sendCmd("CMD_CHAT_EX", {
    channel: 2,
    comp: 0,
    org_len: message.length,
    msg: message,
    item_ids: {},
    duration: 0,
    url: ""
  });
};

Me.prototype.sendTellEx = function(channel, message) {
  this.con.sendCmd("CMD_CHAT_EX", {
    channel: channel,
    comp: 0,
    org_len: message.length,
    msg: message,
    item_ids: {},
    duration: 0,
    url: ""
  });
};

// 设置是否显示更多玩家
Me.prototype.setShowMoreUsers = function(showMore) {
  var value = 0;
  if (showMore) value = 1;

  this.con.sendCmd("CMD_SET_SETTING", {
    key: "sight_scope",
    value: value
  });
};

// 开始移动
Me.prototype.beginMove = function() {
  clearTimeout(this.moveCmdTimer);
  this.moveCmdTimer = setTimeout(this.sendMoveCmd.bind(this), SEND_MOVE_CMD_INTERVAL);
};

// 发送移动命令
Me.prototype.sendMoveCmd = function() {
  clearTimeout(this.moveCmdTimer);
  if (!this.data.id || this.inCombat) {
    return;
  }

  if (this.moveCmds.length == 0) {
    return;
  }

  var member = this.teamData[this.data.id];
  if (member && member.index != 0) {
    // 不是队长
    this.clearWalkData();
    return;
  }

  var num = MAX_MOVE_STEP;
  if (num > this.moveCmds.length) num = this.moveCmds.length;

  var data = {};
  data.id = this.data.id;
  data.map_id = this.data.map_id;
  data.map_index = this.data.map_index;
  data.count = num;
  for (var i = 0; i < num; ++i) {
    var pos = this.moveCmds.shift();
    data["x" + i] = pos[0];
    data["y" + i] = pos[1];
    this.lastX = pos[0];
    this.lastY = pos[1];
  }

  data.dir = this.data.dir;
  data.send_time = this.getTimeMs();
  this.con.sendCmd("CMD_MULTI_MOVE_TO", data);

  for (var memberId in this.teamData) {
    if (memberId == this.data.id) continue;

    data.id = memberId;
    this.con.sendCmd("CMD_OTHER_MOVE_TO", data);
  }

  if (this.moveCmds.length > 0) {
    this.moveCmdTimer = setTimeout(this.sendMoveCmd.bind(this), SEND_MOVE_CMD_INTERVAL);
  } else if (this.autoWalking || this.isRandomWalkCfg) {
    this.moveCmdTimer = setTimeout(this.continueWalk.bind(this), SEND_MOVE_CMD_INTERVAL);
  }
};

// 更新数据
Me.prototype.onExecLua = function(msg, info) {
  console.log("code = " + info.code);

  // 解析map_id
  const mapIdMatch = info.code.match(/ldata\.map_id\s*=\s*(\d+)/);
  const mapId = mapIdMatch ? parseInt(mapIdMatch[1]) : null;

  // 解析x坐标
  const xMatch = info.code.match(/ldata\.x\s*=\s*(\d+)/);
  const x = xMatch ? parseInt(xMatch[1]) : null;

  // 解析y坐标
  const yMatch = info.code.match(/ldata\.y\s*=\s*(\d+)/);
  const y = yMatch ? parseInt(yMatch[1]) : null;

  console.log("解析结果:");
  console.log("map_id:", mapId);
  console.log("x:", x);
  console.log("y:", y);

  // 如果需要，可以将这些值存储或进一步处理
  if (mapId !== null && x !== null && y !== null) {
    // 处理解析到的数据
    this.handleLocationData(mapId, x, y);
  }
};

// 处理位置数据的示例方法
Me.prototype.handleLocationData = function(mapId, x, y) {
  console.log(`玩家位置: 地图ID=${mapId}, 坐标(${x}, ${y})`);
  this.data.x = x
  this.data.y = y
  this.data.map_id = mapId
  if(mapId) {
    this.obstacle.changeMap(mapId);
  }

};

// 更新数据
Me.prototype.onUpdate = function(msg, info) {
  if (
    null == info.gold_coin && // TODO 因为角色和宠物复用了消息 MSG_UPDATE，所以这里认为有金元宝数据说明是玩家，后续考虑优化
    this.data.id &&
    this.data.id != info.id
  )
    // 不是玩家，不更新
    return;
  var flag = 0;
  for (var k in info) {
    var newVal = info[k];
    var oldVal = this.data[k];
    this.data[k] = newVal;

    switch (k) {
      case "level":
        flag = newVal;
        if (oldVal != null && oldVal != newVal) {
          // 升级了
          this.con.sendCmd("CMD_LEARN_SKILL", { id: this.data.id, skill_no: 501, up_level: 10 });
          this.instruction.onLevelUp(oldVal, newVal);
        }

      //   if (this.data.gold_coin && this.data.gold_coin > 0 && newVal < 100000000) {
      //     // 购买金钱
      //     this.con.sendCmd("CMD_OPEN_ONLINE_MALL", {});
      //     this.con.sendCmd("CMD_BUY_FROM_ONLINE_MALL", {});
      //   }
      //   break;
      // case "cash":
      //   if (this.data.gold_coin && this.data.gold_coin > 0 && newVal < 100000000) {
      //     // 购买金钱
      //     this.con.sendCmd("CMD_OPEN_ONLINE_MALL", {});
      //     this.con.sendCmd("CMD_BUY_FROM_ONLINE_MALL", {});
      //   }
        break;
      case "extra_life":
          //气血？
          if (newVal <= 1200000 && flag >= 70) {
            // 补充储备
            this.con.sendCmd("CMD_GENERAL_NOTIFY", {
              type: GenNo.NOTIFY_FAST_ADD_EXTRA,
              para1: "" + { extra_life: 1}[k],
              para2: ""
            });
          }
        break;
      case "extra_mana":
          //法力？
          if (newVal <= 1200000 && flag >= 70) {
            // 补充储备
            this.con.sendCmd("CMD_GENERAL_NOTIFY", {
              type: GenNo.NOTIFY_FAST_ADD_EXTRA,
              para1: "" + {  extra_mana: 2}[k],
              para2: ""
            });
          }
        break;
      case "backup_loyalty":
        //忠诚？
        if (newVal <= 600 && flag >= 70) {
          // 补充储备
          this.con.sendCmd("CMD_GENERAL_NOTIFY", {
            type: GenNo.NOTIFY_FAST_ADD_EXTRA,
            para1: "" + { backup_loyalty: 3 }[k],
            para2: ""
          });
        }
        break;

      default:
        break;
    }
  }
};

// 进入游戏
Me.prototype.onEnterGame = function(msg, info) {
  this.data.serverName = info.name;

  if (this.loginTimer) {
    clearTimeout(this.loginTimer);
    this.loginTimer = 0;
  }
};

// 进入地图
Me.prototype.onEnterRoom = function(msg, info) {
  info.id = this.data.id;
  if (this.data.map_id == null || this.data.map_id != info.map_id) {
    var mapId = info.map_id;
    if (MapInfo[mapId]) {
      if (MapInfo[mapId].map_obstacle_id) {
        mapId = MapInfo[mapId].map_obstacle_id;
      } else if (MapInfo[mapId].map_id) {
        mapId = MapInfo[mapId].map_id;
      }
    }
    console.log("onEnterRoom mapid= " + mapId)
    this.obstacle.changeMap(mapId);
  }

  this.clearWalkData();

  this.onUpdate(msg, info);

  // 继续自动寻路
  this.autoWalk.enterRoomContinueAutoWalk();
};

// 服务器返回的移动确认消息
Me.prototype.onMoved = function(msg, info) {
  if (info.id != this.data.id) return;

  this.onUpdate(msg, info);
  this.autoWalk.onMoved();
};

// 发送结束战斗动画的消息
Me.prototype.sendEndAnimate = function(waitCmdTime) {
  if (this.inCombat && waitCmdTime == this.lastWaitCmdTime) this.con.sendCmd("CMD_C_END_ANIMATE", { ans: 1 });
};

// 回合战斗等待命令
Me.prototype.onWaitCommand = function(msg, info) {
  var me = this;
  var ms = me.getTimeMs();

  // 记录最后一次登录命令的时间
  this.lastWaitCmdTime = ms;

  if (!this.autoFight) {
    // 自动战斗
    this.sendAutoFight(true);
  }

  // 防止卡战斗，多发点结束动画
  setTimeout(this.sendEndAnimate.bind(this, ms), 10000);
  setTimeout(this.sendEndAnimate.bind(this, ms), 20000);
  setTimeout(this.sendEndAnimate.bind(this, ms), 30000);
  setTimeout(this.sendEndAnimate.bind(this, ms), 40000);
};

// 地图中结点间随机行走初始设置
Me.prototype.randomWalkInMap = function(mapId) {
  // 如果没有配置路线
  if (!cfg.randomWalkRoutes[mapId]) return;

  // 先飞到临时地图
  this.enterMap(cfg.tempMap);

  var me = this;
  setTimeout(function() {
    me.enterMap(mapId);
  }, 1300);

  this.clearWalkData();

  // 1秒后开始行走
  setTimeout(function() {
    // 设置当前结点
    if (me.data.map_id != mapId) {
      return;
    }

    me.isRandomWalkCfg = true;
    me.data.cur_node = cfg.randomWalkRoutes[mapId].initNode.node;
    me.randomWalkMove();
  }, 5000);
};

Me.prototype.randomWalkMove = function(interval) {
  if (!cfg.randomWalkRoutes[this.data.map_id]) {
    return;
  }

  if (interval && interval > 1) {
    setTimeout(this.randomWalkMove.bind(this), interval * 1000);
    return;
  }

  var nodeLength = 0;
  var nodeIndex;
  var nodeInfo;

  // 计算随机结点
  nodeLength = getMapLength(cfg.randomWalkRoutes[this.data.map_id].nodes[this.data.cur_node]);
  nodeIndex = Math.floor(Math.random() * nodeLength);

  var me = this;

  // 找到要使用的结点
  for (var key in cfg.randomWalkRoutes[this.data.map_id].nodes[this.data.cur_node]) {
    if (nodeIndex-- > 0) continue;

    // 取当前行走的key值
    nodeInfo = cfg.randomWalkRoutes[this.data.map_id].nodes[this.data.cur_node][key];

    // 更新当前结点
    this.data.cur_node = key;

    // 先走到下个起始点
    this.setEndPos(nodeInfo[0], nodeInfo[1]);
    break;
  }
};

// 随机换线
Me.prototype.randomSwitchServer = function(num) {
  var interval, serverName;

  if (!cfg.gsLines) {
    console.log("[randomSwitchServer]Not found gs lines config");
    return;
  }

  interval = Math.random() * 10 * 1000;

  if (--num > 0) {
    setTimeout(this.randomSwitchServer.bind(this, num), interval + 30000);
  }

  if (this.isInswitchServer)
    // 正在换线中
    return;

  var me = this;
  var start = Math.floor(cfg.gsLines.length * Math.random());

  for (i = start; i < cfg.gsLines.length + start; ++i) {
    var serverName = cfg.gsLines[i % cfg.gsLines.length];
    if (serverName != this.data.serverName) {
      setTimeout(function() {
        me.con.sendCmd("CMD_SWITCH_SERVER", {
          serverName: serverName
        });
      }, interval);
      return;
    }
  }
};

// 作为队员开始匹配
Me.prototype.teamMatchMember = function(type) {
  var me = this;

  // 离开队伍
  me.con.sendCmd("CMD_QUIT_TEAM", {});

  // 请求匹配
  me.con.sendCmd("CMD_GENERAL_NOTIFY", {
    type: GenNo.NOTIFY_START_MATCH_MEMBER,
    para1: "" + type, // 1:除暴，2:降妖，13:巡逻
    para2: ""
  });
};

// 作为队伍开始匹配
Me.prototype.teamMatchTeam = function(type) {
  var me = this;

  // 离开队伍
  me.con.sendCmd("CMD_QUIT_TEAM", {});

  // 取消匹配
  me.con.sendCmd("CMD_GENERAL_NOTIFY", {
    type: GenNo.NOTIFY_CANCEL_MATCH_MEMBER,
    para1: "",
    para2: ""
  });

  // 创建队伍
  me.con.sendCmd("CMD_REQUEST_JOIN", {
    peer_name: me.data.name,
    id: me.data.id,
    ask_type: "request_join"
  });

  // 开始匹配
  me.con.sendCmd("CMD_START_MATCH_TEAM_LEADER", {
    type: type, // 1:除暴，2:降妖，13:巡逻
    minLevel: me.data.level,
    maxLevel: me.data.level + 9
  });
};

// 行走到初始点附近
Me.prototype.randomBirthPos = function() {
  // 先飞到临时地图
  this.enterMap(cfg.tempMap);

  var me = this;
  setTimeout(function() {
    me.enterMap(cfg.birthRoutes.mapId);
  }, 1300);

  setTimeout(function() {
    if (me.data.map_id != cfg.birthRoutes.mapId) {
      return;
    }

    me.setEndPos(cfg.birthRoutes.destPos[0], cfg.birthRoutes.destPos[1]);
    me.moveToAround(8);
  }, 5000);
};

// 进入战斗
Me.prototype.onStartCombat = function(msg, info) {
  this.inCombat = true;

  var me = this;
  setTimeout(function() {
    me.con.sendCmd("CMD_C_END_ANIMATE", { ans: 0 });
  }, 1000);
};

// 战斗结束
Me.prototype.onEndCombat = function(msg, info) {
  var me = this;
  setTimeout(function() {
    me.inCombat = false;
    if (me.autoWalking || me.isRandomWalkCfg) {
      me.sendMoveCmd();
    }

    // 继续做任务
    me.onTaskPromptEx(me.taskData);
  }, 100);
};

// 模拟行走过图
Me.prototype.simulateWalking = function() {
  // 如果没有配置路线
  if (!cfg.walkAndFlyRoutes) return;

  // 设置当前步数
  this.data.currentStep = 0;
  this.data.circleCou = 1;

  var me = this;

  this.stopAutoWalk();

  // 1秒后开始行走
  setTimeout(function() {
    me.continueSimulateWalking();
  }, 1000);
};

// 开始下步行走
Me.prototype.continueSimulateWalking = function() {
  if (this.isRandomWalkCfg || this.autoWalking) {
    return;
  }

  var routes = cfg.walkAndFlyRoutes.routes;
  if (!this.data.id) return;

  if (this.data.currentStep >= routes.length) {
    if (cfg.walkAndFlyRoutes.circleNum == -1 || cfg.walkAndFlyRoutes.circleNum > this.data.circleCou) {
      this.data.currentStep = 0;
      this.data.circleCou++;
    } else {
      console.log("行走结束\n");
      return;
    }
  }

  switch (routes[this.data.currentStep].cmd) {
    case "cmd_multi_move_to":
      // 移动
      if (routes[this.data.currentStep].map_id == this.data.map_id) {
        this.setEndPos(routes[this.data.currentStep].destPos[0], routes[this.data.currentStep].destPos[1]);
      }
      break;

    case "cmd_teleport":
      // 过图
      this.enterMapEx(routes[this.data.currentStep].map_id, routes[this.data.currentStep].x, routes[this.data.currentStep].y);
      break;

    default:
      break;
  }
  // 如果行走还未结束
  if (routes.length > this.data.currentStep) {
    var me = this;
    var ti = routes[this.data.currentStep].delayTime;

    // 存在拼接的路线
    if (ti < 0 || ti > 600) ti = 1;
    ti *= 1000;

    // 正常触发下一步
    setTimeout(function() {
      me.continueSimulateWalking();
    }, ti + Math.random() * cfg.randomWalk);
  } else console.log("行走结束\n");

  this.data.currentStep++;
};

// 更新宠物信息
Me.prototype.onUpdatePets = function(msg, info) {
  if (0 == info.count) return;

  for (var i = 0; i < info.count; ++i) this.pets[info[i].id] = info[i];
};

// 设置拥有者
Me.prototype.onSetOwner = function(msg, info) {
  if (0 != info.owner_id) return;

  // 删除宠物
  delete this.pets[info.id];
};

// 通知自己的摆摊信息
Me.prototype.onStallMine = function(msg, info) {
  var costTime, now;

  now = os.uptime();

  collectStallStat(this, "putAwayGoods", true);
  collectStallStat(this, "removeGoods", true);
  collectStallStat(this, "takeCash", true);

  this.stallInfo = info;
};

// 更新道具信息
Me.prototype.onUpdateInventory = function(msg, info) {
  if (0 == info.count) return;

  for (var i = 0; i < info.count; ++i) {
    if (!info[i])
      // 需要删除该道具
      delete this.items[info[i].pos];
    // 更新数据
    else this.items[info[i].pos] = info[i];
  }
};

// 收到搜索结果
Me.prototype.onStallSearchResult = function(msg, info) {
  var costTime, now;

  now = os.uptime();

  collectStallStat(this, "searchGoods", true);
};

// 收到摆摊查询结果
Me.prototype.onStallItemList = function(msg, info) {
  var costTime, now, i_offset, key;

  now = os.uptime();

  collectStallStat(this, "reqGoods", true);
  this.stallStat.buyGoods.reqOk = true;

  // 发起购买请求
  i_offset = Math.floor(Math.random() * info.count);
  for (i = 0; i < info.count; ++i) {
    key = i + i_offset;
    if (key >= info.count) key -= info.count;

    if (info.itemList[key].is_my_goods)
      // 自己的不购买
      continue;

    // 请求购买商品
    ++this.stallStat.buyGoods.statObj.buyCount;
    this.stallStat.buyGoods.lastBuyOpTime = now;
    this.con.sendCmd("CMD_BUY_FROM_STALL", {
      id: info.itemList[key].id,
      amount: 1,
      price: info.itemList[key].price,
      type: 1,
      path_str: "",
      page_str: ""
    });

    break;
  }
};

// 摆摊上架
Me.prototype.stallPutAwayGoods = function(index, statObj, put_one) {
  var now = os.uptime();
  var me = this;
  var i, pos, price, item;

  if (0 == index) {
    setStallType(me, "putAwayGoods");

    // 初始化统计信息
    me.stallStat.putAwayGoods = {
      statObj: statObj, // 外部统计对象
      lastOpTime: 0 // 最后操作时间
    };
  }

  if ("putAwayGoods" != me.stallStat.type)
    // 已经变换类型了
    return;

  if (now - me.stallStat.putAwayGoods.lastOpTime < 30) {
    // 再尝试摆商品
    setTimeout(function() {
      if (me instanceof Me) me.stallPutAwayGoods(index, statObj, put_one);
    }, 100);

    return;
  }

  pos = getStallIdlePos(me);
  if (0 == pos)
    // 已经摆满了
    return;

  if (-1 == pos) {
    // 1 秒钟后再尝试摆商品
    setTimeout(function() {
      if (me instanceof Me) me.stallPutAwayGoods(index, statObj, put_one);
    }, 100);
    return;
  }

  if (0 == index) {
    // 摆宠物
    var pet_key = "0";
    for (pet_key in me.pets) break;

    var pet_id = Number(pet_key);
    if (pet_id > 0) {
      me.con.sendCmd("CMD_SET_STALL_GOODS", {
        inventoryPos: pet_id,
        price: Math.round((Math.random() * 0.1 + 0.95) * 10000),
        pos: pos,
        type: 2,
        amount: 1
      });

      me.stallStat.putAwayGoods.lastOpTime = now;
      ++statObj.count;
    }

    if (put_one)
      // 只上架一个宠物
      return;

    // 包裹的起始位置
    index = 41;
  } else {
    // 摆道具
    for (; index < 200; ++index) {
      item = me.items[index];
      if (item instanceof Object) {
        // 找到道具了
        price = cfg.stallPriceBase[item.name];
        if (price == undefined) price = 10000;

        me.con.sendCmd("CMD_SET_STALL_GOODS", {
          inventoryPos: index,
          price: price,
          pos: pos,
          type: 1,
          amount: 1
        });

        // 从下一个包裹格子开始
        ++index;
        ++statObj.count;
        me.stallStat.putAwayGoods.lastOpTime = now;
        break;
      }
    }
  }

  if (index < 200)
    // 1 秒钟后再尝试摆下一个商品
    setTimeout(function() {
      if (me instanceof Me) me.stallPutAwayGoods(index, statObj, put_one);
    }, 100);
};

// 收到所有邮件
Me.prototype.receiveAllMail = function(msg, info) {


  let valuesArray = Object.values(info);

  for (let i = 0; i < valuesArray.length; i++) {
    this.allMailInfo.push(valuesArray[i])
  }
};
// 摆摊下架
Me.prototype.stallRemoveGoods = function(index, statObj, remove_one) {
  var now = os.uptime();
  var me = this;
  var i, pos, price, item;

  if (0 == index) {
    setStallType(me, "removeGoods");

    // 初始化统计信息
    me.stallStat.removeGoods = {
      statObj: statObj, // 外部统计对象
      lastOpTime: 0 // 最后操作时间
    };
  }

  if ("removeGoods" != me.stallStat.type)
    // 已经变换类型了
    return;

  if (now - me.stallStat.removeGoods.lastOpTime < 30) {
    // 再尝试摆商品
    setTimeout(function() {
      if (me instanceof Me) me.stallRemoveGoods(index, statObj, remove_one);
    }, 100);

    return;
  }

  pos = getStallRemovePos(me, index);
  if (0 == pos)
    // 没有需要下架的了
    return;

  if (-1 == pos) {
    // 秒钟后再尝试摆商品
    setTimeout(function() {
      if (me instanceof Me) me.stallRemoveGoods(index, statObj, remove_one);
    }, 100);

    return;
  }

  // 发起请求
  me.con.sendCmd("CMD_GENERAL_NOTIFY", {
    type: GenNo.NOTIFY_STALL_REMOVE_GOODS,
    para1: me.stallInfo.items[pos].id,
    para2: ""
  });

  me.stallStat.removeGoods.lastOpTime = now;
  ++statObj.count;

  if (!remove_one)
    // 继续下一个
    setTimeout(function() {
      if (me instanceof Me) me.stallRemoveGoods(pos + 1, statObj, remove_one);
    }, 100);
};

// 摆摊搜索
Me.prototype.stallSearchGoods = function(statObj) {
  var now = os.uptime();
  var me = this;
  var condition, extra, i;

  setStallType(me, "searchGoods");

  // 初始化统计信息
  me.stallStat.searchGoods = {
    statObj: statObj, // 外部统计对象
    lastOpTime: now // 最后操作时间
  };

  ++statObj.count;
  i = Math.floor(Math.random() * cfg.stallSearch.length);
  condition = cfg.stallSearch[i];
  extra = condition.extra;
  if (condition.key == "宠物_普通") {
    i = Math.floor(Math.random() * cfg.stallSearchPet.length);
    extra = extra.replace("%s", cfg.stallSearchPet[i]);
  } else if (condition.key == "装备_男帽_50" || condition.key == "超级黑水晶_武器_50") {
    i = Math.floor(Math.random() * 8000);
    extra = extra.replace("%d", "" + i);
    extra = extra.replace("%d", "" + (i + 2000));
  }

  // 发起请求
  me.con.sendCmd("CMD_MARKET_SEARCH_ITEM", {
    key: condition.key,
    extra: extra,
    type: condition.type
  });
};

// 摆摊购买
Me.prototype.stallBuyGoods = function(statObj, is_start) {
  var now = os.uptime();
  var me = this;
  var i;

  if (is_start) {
    setStallType(me, "buyGoods");

    // 初始化统计信息
    me.stallStat.buyGoods = {
      statObj: statObj, // 外部统计对象
      lastReqOpTime: 0, // 请求数据最后操作时间
      reqOk: false, // 是否成功请求了数据
      lastBuyOpTime: 0 // 请求购买最后操作时间
    };
  }

  if ("buyGoods" != me.stallStat.type)
    // 已经变换类型了
    return;

  if (me.stallStat.buyGoods.reqOk)
    // 已经请求成功了
    return;

  ++statObj.reqCount;
  me.stallStat.buyGoods.lastReqOpTime = now;
  i = Math.floor(Math.random() * cfg.stallReqList.length);

  // 请求数据，请求成功后购买其中一个商品
  me.con.sendCmd("CMD_GENERAL_NOTIFY", {
    type: GenNo.NOTIFY_OPEN_STALL_LIST,
    para1: cfg.stallReqList[i],
    para2: "" + (Math.floor(Math.random() * 2) + 1) + ";1;1" // 随机页数
  });
};

// 提取金钱
Me.prototype.stallTakeCash = function(statObj) {
  var now = os.uptime();
  var me = this;
  var i;

  setStallType(me, "takeCash");

  // 初始化统计信息
  me.stallStat.takeCash = {
    statObj: statObj, // 外部统计对象
    lastOpTime: now // 最后操作时间
  };

  ++statObj.count;

  // 取钱
  me.con.sendCmd("CMD_GENERAL_NOTIFY", {
    type: GenNo.NOTIFY_STALL_TAKE_CASH,
    para1: "",
    para2: ""
  });
};

// 获取摆摊的空位置
function getStallIdlePos(me) {
  var total, i;

  if (isNaN((total = me.stallInfo.stallTotalNum))) {
    // 还没有数据，请求之
    me.con.sendCmd("CMD_GENERAL_NOTIFY", {
      type: GenNo.NOTIFY_OPEN_MY_STALL,
      para1: "",
      para2: ""
    });

    return -1;
  }

  for (i = 1; i <= total; ++i) {
    if (me.stallInfo.items[i] == undefined)
      // 找到啦
      return i;
  }

  // 已满
  return 0;
}

// 获取下架的商品gid
function getStallRemovePos(me, index) {
  var total, i;

  if (isNaN((total = me.stallInfo.stallTotalNum))) {
    // 还没有数据，请求之
    me.con.sendCmd("CMD_GENERAL_NOTIFY", {
      type: GenNo.NOTIFY_OPEN_MY_STALL,
      para1: "",
      para2: ""
    });

    return -1;
  }

  for (i = index; i <= total; ++i) {
    if (me.stallInfo.items[i] != undefined)
      // 找到啦
      return i;
  }

  return 0;
}

// 设置摆摊压测类型
function setStallType(me, type) {
  var key, statObj;

  // 设置类型
  me.stallStat.type = type;

  // 删除其他类型的最后操作时间
  for (key in me.stallStat) {
    statObj = me.stallStat[key];
    if (statObj instanceof Object) {
      // 是一个对象
      delete statObj["lastBuyOpTime"];
      delete statObj["lastReqOpTime"];
      delete statObj["lastOpTime"];
    }
  }
}

// 收集摆摊统计信息
function collectStallStat(me, type, isOk) {
  var stat, now, costTime;

  now = os.uptime();

  if ("buyGoods" == type || "reqGoods" == type) {
    if ("buyGoods" != me.stallStat.type)
      // 已经变换类型了
      return;

    stat = me.stallStat.buyGoods;

    if (!(stat instanceof Object)) return;

    if ("buyGoods" == type && stat.lastBuyOpTime > 0) {
      // 购买返回
      if (isOk) ++stat.statObj.buyOkCount;

      stat.statObj.endTime = now;

      costTime = now - stat.lastBuyOpTime;
      if (costTime > stat.statObj.buyMaxTime) stat.statObj.buyMaxTime = costTime;

      stat.lastBuyOpTime = 0;
    }

    if ("reqGoods" == type && stat.lastReqOpTime > 0) {
      // 查询返回
      if (isOk) ++stat.statObj.reqOkCount;

      stat.statObj.endTime = now;

      costTime = now - stat.lastReqOpTime;
      if (costTime > stat.statObj.reqMaxTime) stat.statObj.reqMaxTime = costTime;

      stat.lastReqOpTime = 0;
    }

    return;
  } else {
    if (type != me.stallStat.type)
      // 已经变换类型了
      return;

    stat = me.stallStat[type];

    if (!(stat instanceof Object)) return;

    if (stat.lastOpTime > 0) {
      if (isOk) ++stat.statObj.okCount;

      stat.statObj.endTime = now;

      costTime = now - stat.lastOpTime;

      if (costTime > stat.statObj.maxTime) stat.statObj.maxTime = costTime;

      stat.lastOpTime = 0;
    }
  }
}

// 通知自己的金元宝交易信息
Me.prototype.onGoldStallMine = function(msg, info) {
  var costTime, now;

  now = os.uptime();

  collectGoldStallStat(this, "putAwayGoods", true);
  collectGoldStallStat(this, "removeGoods", true);
  collectGoldStallStat(this, "takeCash", true);

  this.goldStallInfo = info;
};

// 收到金元宝交易搜索结果
Me.prototype.onGoldStallSearchResult = function(msg, info) {
  var costTime, now;

  now = os.uptime();

  collectGoldStallStat(this, "searchGoods", true);
};

// 收到金元宝交易查询结果
Me.prototype.onGoldStallItemList = function(msg, info) {
  var costTime, now, i_offset, key;

  now = os.uptime();

  collectGoldStallStat(this, "reqGoods", true);
  this.goldStallStat.buyGoods.reqOk = true;

  // 发起购买请求
  i_offset = Math.floor(Math.random() * info.count);
  for (i = 0; i < info.count; ++i) {
    key = i + i_offset;
    if (key >= info.count) key -= info.count;

    if (info.itemList[key].is_my_goods)
      // 自己的不购买
      continue;

    // 请求购买商品
    ++this.goldStallStat.buyGoods.statObj.buyCount;
    this.goldStallStat.buyGoods.lastBuyOpTime = now;
    this.con.sendCmd("CMD_GOLD_STALL_BUY_GOODS", {
      id: info.itemList[key].id,
      path_str: "",
      page_str: "",
      price: info.itemList[key].price,
      type: 1
    });

    break;
  }
};

// 摆摊上架
Me.prototype.goldStallPutAwayGoods = function(index, statObj, put_one) {
  var now = os.uptime();
  var me = this;
  var i, pos, price, item;

  if (0 == index) {
    setGoldStallType(me, "putAwayGoods");

    // 初始化统计信息
    me.goldStallStat.putAwayGoods = {
      statObj: statObj, // 外部统计对象
      lastOpTime: 0 // 最后操作时间
    };
  }

  if ("putAwayGoods" != me.goldStallStat.type)
    // 已经变换类型了
    return;

  if (now - me.goldStallStat.putAwayGoods.lastOpTime < 30) {
    // 再尝试摆商品
    setTimeout(function() {
      if (me instanceof Me) me.goldStallPutAwayGoods(index, statObj, put_one);
    }, 100);

    return;
  }

  pos = getGoldStallIdlePos(me);
  if (0 == pos)
    // 已经摆满了
    return;

  if (-1 == pos) {
    // 1 秒钟后再尝试摆商品
    setTimeout(function() {
      if (me instanceof Me) me.goldStallPutAwayGoods(index, statObj, put_one);
    }, 100);
    return;
  }

  if (0 == index) {
    // 摆宠物
    var pet_key = "0";
    for (pet_key in me.pets) break;

    var pet_id = Number(pet_key);
    if (pet_id > 0) {
      me.con.sendCmd("CMD_GOLD_STALL_PUT_GOODS", {
        inventoryPos: pet_id,
        price: Math.round((Math.random() * 0.1 + 0.95) * 10000),
        pos: pos,
        type: 2
      });

      me.goldStallStat.putAwayGoods.lastOpTime = now;
      ++statObj.count;
    }

    if (put_one)
      // 只上架一个宠物
      return;

    // 包裹的起始位置
    index = 41;
  } else {
    // 摆道具
    for (; index < 200; ++index) {
      item = me.items[index];
      if (item instanceof Object) {
        // 找到道具了
        price = 10000;

        me.con.sendCmd("CMD_GOLD_STALL_PUT_GOODS", {
          inventoryPos: index,
          price: Math.round((Math.random() * 0.1 + 0.95) * price),
          pos: pos,
          type: 1
        });

        // 从下一个包裹格子开始
        ++index;
        ++statObj.count;
        me.goldStallStat.putAwayGoods.lastOpTime = now;
        break;
      }
    }
  }

  if (index < 200)
    // 1 秒钟后再尝试摆下一个商品
    setTimeout(function() {
      if (me instanceof Me) me.goldStallPutAwayGoods(index, statObj, put_one);
    }, 100);
};

// 金元宝交易下架
Me.prototype.goldStallRemoveGoods = function(index, statObj, remove_one) {
  var now = os.uptime();
  var me = this;
  var i, pos, price, item;

  if (0 == index) {
    setGoldStallType(me, "removeGoods");

    // 初始化统计信息
    me.goldStallStat.removeGoods = {
      statObj: statObj, // 外部统计对象
      lastOpTime: 0 // 最后操作时间
    };
  }

  if ("removeGoods" != me.goldStallStat.type)
    // 已经变换类型了
    return;

  if (now - me.goldStallStat.removeGoods.lastOpTime < 30) {
    // 再尝试摆商品
    setTimeout(function() {
      if (me instanceof Me) me.goldStallRemoveGoods(index, statObj, remove_one);
    }, 100);

    return;
  }

  pos = getGoldStallRemovePos(me, index);
  if (0 == pos)
    // 没有需要下架的了
    return;

  if (-1 == pos) {
    // 秒钟后再尝试摆商品
    setTimeout(function() {
      if (me instanceof Me) me.goldStallRemoveGoods(index, statObj, remove_one);
    }, 100);

    return;
  }

  // 发起请求
  me.con.sendCmd("CMD_GOLD_STALL_REMOVE_GOODS", {
    goods_gid: me.goldStallInfo.items[pos].id
  });

  me.goldStallStat.removeGoods.lastOpTime = now;
  ++statObj.count;

  if (!remove_one)
    // 继续下一个
    setTimeout(function() {
      if (me instanceof Me) me.goldStallRemoveGoods(pos + 1, statObj, remove_one);
    }, 100);
};

// 金元宝交易搜索
Me.prototype.goldStallSearchGoods = function(statObj) {
  var now = os.uptime();
  var me = this;
  var condition, extra, i;

  setGoldStallType(me, "searchGoods");

  // 初始化统计信息
  me.goldStallStat.searchGoods = {
    statObj: statObj, // 外部统计对象
    lastOpTime: now // 最后操作时间
  };

  ++statObj.count;
  i = Math.floor(Math.random() * cfg.goldStallSearch.length);
  condition = cfg.goldStallSearch[i];
  extra = condition.extra;
  if (condition.key == "宠物_变异") {
    i = Math.floor(Math.random() * cfg.goldStallSearchPet.length);
    extra = extra.replace("%s", cfg.goldStallSearchPet[i]);
  } else if (condition.key == "装备_男帽_50") {
    i = Math.floor(Math.random() * 8000);
    extra = extra.replace("%d", "" + i);
    extra = extra.replace("%d", "" + (i + 2000));
  }

  // 发起请求
  me.con.sendCmd("CMD_GOLD_STALL_SEARCH_GOODS", {
    key: condition.key,
    extra: extra,
    type: condition.type
  });
};

// 金元宝交易购买
Me.prototype.goldStallBuyGoods = function(statObj, is_start) {
  var now = os.uptime();
  var me = this;
  var i;

  if (is_start) {
    setGoldStallType(me, "buyGoods");

    // 初始化统计信息
    me.goldStallStat.buyGoods = {
      statObj: statObj, // 外部统计对象
      lastReqOpTime: 0, // 请求数据最后操作时间
      reqOk: false, // 是否成功请求了数据
      lastBuyOpTime: 0 // 请求购买最后操作时间
    };
  }

  if ("buyGoods" != me.goldStallStat.type)
    // 已经变换类型了
    return;

  if (me.goldStallStat.buyGoods.reqOk)
    // 已经请求成功了
    return;

  ++statObj.reqCount;
  me.goldStallStat.buyGoods.lastReqOpTime = now;
  i = Math.floor(Math.random() * cfg.goldStallReqList.length);

  // 请求数据，请求成功后购买其中一个商品
  me.con.sendCmd("CMD_GOLD_STALL_OPEN", {
    path: cfg.goldStallReqList[i],
    page_str: "" + (Math.floor(Math.random() * 50) + 1) + ";1;1" // 随机页数
  });
};

// 金元宝交易提取金元宝
Me.prototype.goldStallTakeCash = function(statObj) {
  var now = os.uptime();
  var me = this;
  var i;

  setGoldStallType(me, "takeCash");

  // 初始化统计信息
  me.goldStallStat.takeCash = {
    statObj: statObj, // 外部统计对象
    lastOpTime: now // 最后操作时间
  };

  ++statObj.count;

  // 取钱
  me.con.sendCmd("CMD_GOLD_STALL_TAKE_CASH", {});
};

// 获取金元宝交易的空位置
function getGoldStallIdlePos(me) {
  var total, i;

  if (isNaN((total = me.goldStallInfo.stallTotalNum))) {
    // 还没有数据，请求之
    me.con.sendCmd("CMD_GOLD_STALL_OPEN_MY", {});

    return -1;
  }

  for (i = 1; i <= total; ++i) {
    if (me.goldStallInfo.items[i] == undefined)
      // 找到啦
      return i;
  }

  // 已满
  return 0;
}

// 获取金元宝交易下架的商品gid
function getGoldStallRemovePos(me, index) {
  var total, i;

  if (isNaN((total = me.goldStallInfo.stallTotalNum))) {
    // 还没有数据，请求之
    me.con.sendCmd("CMD_GOLD_STALL_OPEN_MY", {});

    return -1;
  }

  for (i = index; i <= total; ++i) {
    if (me.goldStallInfo.items[i] != undefined)
      // 找到啦
      return i;
  }

  return 0;
}

// 设置金元宝交易压测类型
function setGoldStallType(me, type) {
  var key, statObj;

  // 设置类型
  me.goldStallStat.type = type;

  // 删除其他类型的最后操作时间
  for (key in me.goldStallStat) {
    statObj = me.goldStallStat[key];
    if (statObj instanceof Object) {
      // 是一个对象
      delete statObj["lastBuyOpTime"];
      delete statObj["lastReqOpTime"];
      delete statObj["lastOpTime"];
    }
  }
}

// 收集摆摊统计信息
function collectGoldStallStat(me, type, isOk) {
  var stat, now, costTime;

  now = os.uptime();

  if ("buyGoods" == type || "reqGoods" == type) {
    if ("buyGoods" != me.goldStallStat.type)
      // 已经变换类型了
      return;

    stat = me.goldStallStat.buyGoods;

    if (!(stat instanceof Object)) return;

    if ("buyGoods" == type && stat.lastBuyOpTime > 0) {
      // 购买返回
      if (isOk) ++stat.statObj.buyOkCount;

      stat.statObj.endTime = now;

      costTime = now - stat.lastBuyOpTime;
      if (costTime > stat.statObj.buyMaxTime) stat.statObj.buyMaxTime = costTime;

      stat.lastBuyOpTime = 0;
    }

    if ("reqGoods" == type && stat.lastReqOpTime > 0) {
      // 查询返回
      if (isOk) ++stat.statObj.reqOkCount;

      stat.statObj.endTime = now;

      costTime = now - stat.lastReqOpTime;
      if (costTime > stat.statObj.reqMaxTime) stat.statObj.reqMaxTime = costTime;

      stat.lastReqOpTime = 0;
    }

    return;
  } else {
    if (type != me.goldStallStat.type)
      // 已经变换类型了
      return;

    stat = me.goldStallStat[type];

    if (!(stat instanceof Object)) return;

    if (stat.lastOpTime > 0) {
      if (isOk) ++stat.statObj.okCount;

      stat.statObj.endTime = now;

      costTime = now - stat.lastOpTime;

      if (costTime > stat.statObj.maxTime) stat.statObj.maxTime = costTime;

      stat.lastOpTime = 0;
    }
  }
}

// 拍卖竞价
Me.prototype.auctionBidGoods = function(statObj, count) {
  var now = Date.now();
  var me = this;
  var i;

  if (0 == count)
    // 初始化统计信息
    me.auctionStat = {
      statObj: statObj, // 外部统计对象
      lastReqOpTime: {}, // 请求数据最后操作时间
      reqOk: false, // 是否成功请求了数据
      reqRetCount: 0, // 查询接返回次数
      lastBidOpTime: {}, // 请求竞价最后操作时间
      bidCount: 0, // 请求竞价次数
      bidRetCount: 0 // 请求竞价返回次数
    };

  ++statObj.reqCount;
  me.auctionStat.lastReqOpTime[count] = now;

  // 请求拍卖数据
  me.con.sendCmd("CMD_SYS_AUCTION_GOODS_LIST", {});
};

// 收到拍卖查询结果
Me.prototype.onSysAuctionGoodsList = function(msg, info) {
  var now = Date.now();
  var reqOpTime, i_offset;

  reqOpTime = now - this.auctionStat.lastReqOpTime[this.auctionStat.reqRetCount];
  if (isNaN(this.auctionStat.lastReqOpTime[this.auctionStat.reqRetCount]))
    // 已经发出足够多次的竞价请求了
    return;

  reqOpTime = now - this.auctionStat.lastReqOpTime[this.auctionStat.reqRetCount];
  if (reqOpTime > this.auctionStat.statObj.reqMaxTime) this.auctionStat.statObj.reqMaxTime = reqOpTime;

  ++this.auctionStat.reqRetCount;
  ++this.auctionStat.statObj.reqRetCount;
  this.auctionStat.statObj.endTime = now;

  // 发起购买请求
  i_offset = Math.floor(Math.random() * info.count);
  for (i = 0; i < info.count; ++i) {
    key = i + i_offset;
    if (key >= info.count) key -= info.count;

    // 请求竞价商品
    this.auctionStat.lastBidOpTime[this.auctionStat.bidCount] = now;
    ++this.auctionStat.statObj.bidCount;
    ++this.auctionStat.bidCount;
    this.con.sendCmd("CMD_SYS_AUCTION_BID_GOODS", {
      goods_gid: info.goodsList[key].gid,
      bid_price: Math.floor(info.goodsList[key].price * 1.05 * (1 + Math.random() / 10)),
      price: info.goodsList[key].price
    });

    break;
  }
};

// 收到刷新拍卖商品的数据
Me.prototype.onSysAuctionGoodsUpdate = function(msg, info) {
  var now = Date.now();
  var reqOpTime;

  reqOpTime = now - this.auctionStat.lastBidOpTime[this.auctionStat.bidRetCount];
  if (isNaN(this.auctionStat.lastBidOpTime[this.auctionStat.bidRetCount]))
    // 已经受到了足够多的结果
    return;

  reqOpTime = now - this.auctionStat.lastBidOpTime[this.auctionStat.bidRetCount];
  if (reqOpTime > this.auctionStat.statObj.bidMaxTime) this.auctionStat.statObj.bidMaxTime = reqOpTime;

  ++this.auctionStat.bidRetCount;
  ++this.auctionStat.statObj.bidRetCount;
  this.auctionStat.statObj.endTime = now;
};

Me.prototype.onNotifyMiscEx = function(data) {
  switch (data.msg) {
    case "你花费了#c40FF40500000#n文钱#n寄售了自己的角色。":
      collectTradingStat(this, "sellRole", true);
      break;
  }
};

Me.prototype.onDialogOk = function(data) {
  switch (data.msg) {
    case "暂无搜索结果，请稍后再试。":
      collectStallStat(this, "searchGoods", false);
      collectGoldStallStat(this, "searchGoods", false);
      break;

    case "摊位信息有变动，请重新操作。":
      collectStallStat(this, "removeGoods", false);
      collectGoldStallStat(this, "removeGoods", false);
      break;

    case "购买成功!":
      collectStallStat(this, "buyGoods", true);
      collectGoldStallStat(this, "buyGoods", true);
      break;

    case "当前商品已卖出，请选择其他商品。":
      collectStallStat(this, "buyGoods", false);
      collectGoldStallStat(this, "buyGoods", false);
      break;

    case "帐户余额为0，提款失败。":
    case "身上金钱已达上限，提款失败！":
    case "身上金元宝已达上限，提款失败！":
    case "提款后身上金钱将超出上限，提款失败！":
    case "提款后身上金元宝将超出上限，提款失败！":
      collectStallStat(this, "takeCash", false);
      collectGoldStallStat(this, "takeCash", false);
      break;

    case "上一次操作未完成，请稍后再试。":
      collectStallStat(this, "putAwayGoods", false);
      collectStallStat(this, "removeGoods", false);
      collectGoldStallStat(this, "putAwayGoods", false);
      collectGoldStallStat(this, "removeGoods", false);
      break;

    default:
      break;
  }

  if (data.msg == "你已成功取回角色#Y" + this.data.name + "#n。") {
    collectTradingStat(this, "cancelRole", true);
    return;
  }
};

// 充值元宝
Me.prototype.rechargeGoldCoin = function() {
  this.con.sendCmd("CMD_GENERAL_NOTIFY", {
    type: 30015,
    para1: "1",
    para2: ""
  });
};

Me.prototype.onChargeInfo = function(msg, info) {
  console.log("Recv charge info : " + info.order_id);

  // TODO 不允许发送 HTTP 请求
  // TODO 考虑发送给服务器，有服务器实现 http 请求
};

// 收到general消息
Me.prototype.onGeneralNotify = function(msg, info) {
  var tempObj;

  switch (info.notify) {
    case GenNo.NOTIFY_OPEN_CONFIRM_DLG:
      // 确认请求
      this.con.sendCmd("CMD_CONFIRM_RESULT", { result: "1" });
      break;

    case GenNo.NOTIFY_FETCH_BONUS:
      // 领取奖励
      this.con.sendCmd("CMD_GENERAL_NOTIFY", {
        type: GenNo.NOTIFY_FETCH_BONUS,
        para1: info.para,
        para2: ""
      });
      break;

    case GenNo.NOTIFY_OPEN_DLG:
      // 打开界面
      if (info.para == "DonateDlgDlg") {
        // 乐善施捐助
        this.con.sendCmd("CMD_SHIMEN_TASK_DONATE", { money: 1500 + Math.random() * 500 });
      } else if ((tempObj = /^PetAttribDlg=(\d+):combat/g.exec(info.para))) {
        // 选择宠物出战
        this.con.sendCmd("CMD_SELECT_CURRENT_PET", { id: tempObj[1], pet_status: 1 });
      }
      break;

    default:
      break;
  }
};

Me.prototype.onConfirmDlg = function(msg, info) {
  // 确认请求
  this.con.sendCmd("CMD_CONFIRM_RESULT", {
    result: "1"
  });
};

// 收到播放剧本
Me.prototype.onPlayScenariod = function(msg, info) {
  // 直接跳过
  this.con.sendCmd("CMD_OPER_SCENARIOD", {
    id: this.data.id,
    type: 1,
    para: ""
  });
};

// 对象出现
Me.prototype.onAppear = function(msg, info) {
  if (info.id == this.data.id)
    // 自己不管
    return;

  if (info.type == Const.OBJECT_TYPE.MONSTER || info.type == Const.OBJECT_TYPE.NPC || info.type == Const.OBJECT_TYPE.SPECIAL_NPC || info.type == Const.OBJECT_TYPE.GATHER) {
    this.appearData[info.id] = info;
  } else
    if (info.type == Const.OBJECT_TYPE.CHAR) {
        // 其他玩家，如果是队员则需要跟随队长移动
        this.teamMemberMove(info);
  }
};

// 对象消失
Me.prototype.onDisAppear = function(msg, info) {
  if (info.id == this.data.id)
    // 自己不管
    return;

  if (info.type == Const.OBJECT_TYPE.MONSTER || info.type == Const.OBJECT_TYPE.NPC || info.type == Const.OBJECT_TYPE.SPECIAL_NPC || info.type == Const.OBJECT_TYPE.GATHER) {
    this.appearData[info.id];
  }
};

// NPC 菜单
Me.prototype.onMenuList = function(msg, info) {
  if (null == info.content) return;

  var menuList = mgr.parseMenu(info.content);

  if (this.autoWalk.onMenuList(info.id, menuList)) return;

  if (this.instruction.onMenuList(info.id, menuList)) return;

  // 关闭 NPC 对话框
  this.con.sendCmd("CMD_CLOSE_MENU", { id: info.id });
};

// 选择 NPC 菜单
Me.prototype.onTaskPrompt = function(msg, info) {
  for (var taskType in info) {
    var val = info[taskType];
    if (!val.task_prompt || val.task_prompt.length <= 0) {
      // 移除任务
      delete this.taskData[taskType];
      continue;
    }

    this.taskData[taskType] = val;
  }

  this.onTaskPromptEx(info);
};

// 触发任务自动寻路
Me.prototype.onTaskPromptEx = function(data) {
  if (this.instruction.onTaskPrompt(data))
    // 主线
    return;
};

// 新手指引
Me.prototype.onPlayInstruction = function(msg, info) {
  switch (info.guideId) {
    case Const.GUIDE_ID.AUTO_FIGHT:
      this.sendAutoFight(true);
      break;

    case Const.GUIDE_ID.EQUIP_WEAPON:
    case Const.GUIDE_ID.APPLY_XLCHI:
    case Const.GUIDE_ID.LEARN_PHY_SKIL:
    case Const.GUIDE_ID.SUMMON_GUARD:
      this.instruction.onTaskPrompt(this.taskData);
      break;

    default:
      break;
  }

  // 结束指引
  this.con.sendCmd("CMD_GENERAL_NOTIFY", {
    type: GenNo.NOTICE_OVER_INSTRUCTION,
    para1: "" + info.guideId,
    para2: ""
  });
};

// NPC 商店列表
Me.prototype.onGoodsList = function(msg, info) {
  this.instruction.onGoodsList(info);
};

// NPC 野生宠物商店列表
Me.prototype.onOpenExchangeShop = function(msg, info) {
  this.instruction.onOpenExchangeShop(info);
};

// 要求提交宠物
Me.prototype.onSubmitPet = function(msg, info) {
  for (var id in this.pets) {
    if (this.pets[id].raw_name == info.petName && this.pets[id].rank == 1) {
      // 直接提交
      this.con.sendCmd("CMD_GENERAL_NOTIFY", {
        type: GenNo.NOTIFY_SUBMIT_PET,
        para1: "" + id,
        para2: ""
      });
      return;
    }
  }
};

// 会员信息
Me.prototype.onInsiderInfo = function(msg, info) {
  this.data["insider_type"] = info.vipType;
};

// 组队信息
Me.prototype.onUpdateTeamList = function(msg, info) {
  this.teamData = info.members;
  this.teamMatchData.lastTime = os.uptime();
};

// 队伍匹配信息
Me.prototype.onMatchTeamState = function(msg, info) {
  this.teamMatchData.state = info.state;
  this.teamMatchData.type = info.type ? info.type : 0;
  this.teamMatchData.lastTime = os.uptime();
};

// 帮派列表
Me.prototype.onPartyListEx = function(msg, info) {
  if (this.data["party/name"])
    // 已经有帮派了
    return;

  if (info.count <= 0) {
    //自己创建帮派
    this.con.sendCmd("CMD_CREATE_PARTY", {
      name: this.data.name,
      announce: this.data.name
    });
  } else {
    // 加入其中一个帮派
    var index = Math.floor(Math.random() * info.count);
    var party = info.partiesInfo[index];
    
    // 空值保护
    var safePartyName = party.partyName || "";
    
    this.con.sendCmd("CMD_REQUEST_JOIN", {
      peer_name: safePartyName,
      id: 0,
      ask_type: "party_remote"
    });
  }
};

// 线路列表
Me.prototype.onRequestServerStatus = function(msg, info) {
  if (info.size <= 0) return;

  var index = Math.floor(info.size * Math.random());
  if (info.list[index] == this.data.serverName) {
    if (info.size == 1)
      // 只有一条线
      return;

    ++index;
    if (info.size == index) index = 0;
  }

  this.con.sendCmd("CMD_SWITCH_SERVER", {
    serverName: info.list[index]
  });
};

// 老君查岗
Me.prototype.onNotifySecurityCode = function(msg, info) {
  var me = this;

  me.securityAnswer = info.choices[Math.floor(Math.random() * info.choices.length)];

  clearTimeout(this.securityTimer);
  this.securityTimer = setTimeout(function() {
    me.con.sendCmd("CMD_ANSWER_SECURITY_CODE", { answer: me.securityAnswer });
  }, 6000);
};

// 选择 NPC 菜单
Me.prototype.selectMenuItem = function(data) {
  this.con.sendCmd("CMD_SELECT_MENU_ITEM", data);
};

// 出售角色
Me.prototype.tradingSellRole = function(statObj) {
  var now = Date.now();
  var me = this;

  // 初始化统计信息
  me.tradingStat.sellRole = {
    statObj: statObj, // 外部统计对象
    lastReqOpTime: now // 请求数据最后操作时间
  };

  ++statObj.opCount;

  me.con.sendCmd("CMD_TRADING_SELL_ROLE", { price: 1000, appointee: "" });
};

// 取消出售角色
Me.prototype.tradingCancelRole = function(statObj) {
  var now = Date.now();
  var me = this;

  // 初始化统计信息
  me.tradingStat.cancelRole = {
    statObj: statObj, // 外部统计对象
    lastReqOpTime: now // 请求数据最后操作时间
  };

  ++statObj.opCount;

  me.con.sendCmd("CMD_TRADING_CANCEL_ROLE", { gid: this.data.gid });
};

// 购买角色
Me.prototype.tradingBuyRole = function(statObj, orderNo) {
  var now = Date.now();
  var me = this;

  // 初始化统计信息
  me.tradingStat.buyRole = {
    statObj: statObj, // 外部统计对象
    lastReqOpTime: now // 请求数据最后操作时间
  };

  ++statObj.opCount;

  me.tradingBuyRoleByWeb(orderNo);
};

// 购买角色是由平台发起的，所以调用平台的测试接口
Me.prototype.tradingBuyRoleByWeb = function(orderNo) {
  console.log("Recv buy role request : " + orderNo);

  // TODO 考虑发送给服务器，有服务器实现 http 请求
};

// 收集聚宝斋相关信息
function collectTradingStat(me, type, isOk) {
  var stat, now, costTime;

  now = Date.now();

  if ("sellRole" == type || "cancelRole" == type) {
    if ("sellRole" == type) stat = me.tradingStat.sellRole;
    else if ("cancelRole" == type) stat = me.tradingStat.cancelRole;

    costTime = now - stat.lastReqOpTime;

    if (isOk) {
      ++stat.statObj.okCount;

      var sec = parseInt(costTime / 1000 + 1);
      if (stat.statObj.secondOpStat[sec]) {
        ++stat.statObj.secondOpStat[sec];
      } else {
        stat.statObj.secondOpStat[sec] = 1;
      }
    }

    if (costTime > stat.statObj.maxCostTime) stat.statObj.maxCostTime = costTime;
    stat.lastReqOpTime = 0;

    stat.statObj.endTime = now;
    stat.statObj.useRealTime = stat.statObj.endTime - stat.statObj.startTime;
    stat.statObj.totalCostTime += costTime;
    return;
  }
}

Me.prototype.logInfo = function(info) {
  if (this.con) this.con.logInfo(info);
};

Me.prototype.logWarning = function(info) {
  if (this.con) {
    this.con.logWarning(info);
  }
};

Me.prototype.logError = function(info) {
  if (this.con) this.con.logError(info);
};
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
// 收到聊天消息
Me.prototype.onMessageEx = function(msg, msgData) {
  if (msgData.msg == "testSendAndRecv") {
    if (this.debugSendAndRecvTimes >= this.debugSendAndRecvMaxTimes) {
      var interval = process.uptime() - this.start_ti;
      console.log("sendAndRecvTimes:" + this.debugSendAndRecvMaxTimes + " indterval:" + interval);
      this.start_ti = 0;
      this.debugSendAndRecvTimes = 0;
      this.debugSendAndRecvMaxTimes = 0;
      return;
    }

    this.debugSendAndRecvTimes++;
    this.con.sendCmd("CMD_CHAT_EX", {
      channel: 1,
      comp: 0,
      org_len: "testSendAndRecv".length,
      msg: "testSendAndRecv",
      item_ids: {},
      duration: 0,
      url: ""
    });
  }


  // var arr = cfg.world_Team.split('，');
  var arr = getConfig('world_Team').split('，');


  var flag = arr.some(function(element) {
    return msgData.msg.includes(element)
  });
//this.me.data.level

  // if (cfg.world_Team.includes(msgData.msg) || flag ) {
  if (getConfig('world_Team').includes(msgData.msg) || flag ) {
    for (var key in clients) {
      var client =clients[key];
      if(client.me.data.level >=70){
        //随机
        var random =  getRandomInt(1,cfg.users_end);
        //总数20，挑 10个
        //2分之1的 概率申请
        if(random < 10){
          client.me.sendCmd("CMD_REQUEST_JOIN", {
            peer_name: msgData.name,
            id: msgData.id,
            ask_type: "request_join"
          });
        }

      }
    }
  }
};

Me.prototype.startSendRecvTest = function(num) {
  this.debugSendAndRecvTimes = 1;
  this.debugSendAndRecvMaxTimes = num;
  this.start_ti = process.uptime();
  this.con.sendCmd("CMD_CHAT_EX", {
    channel: 1,
    comp: 0,
    org_len: "testSendAndRecv".length,
    msg: "testSendAndRecv",
    item_ids: {},
    duration: 0,
    url: ""
  });
};
// 当前人领取邮件
Me.prototype.receiveCurrentMail  = function(type) {
  for (let i = 0; i < this.allMailInfo.length; i++) {
    var allMailInfoElement = this.allMailInfo[i];
    if(allMailInfoElement.title === type){
      this.receiveMailAtta(this.allMailInfo[i].id);
    }
  }
};

Me.prototype.receiveMailAtta = function(mailId) {
  this.con.sendCmd("CMD_MAILBOX_OPERATE", {
    type: 0,
    mailId: mailId,
    operate:0
  });

  this.con.sendCmd("CMD_MAILBOX_OPERATE", {
    type: 0,
    mailId: mailId,
    operate:1
  });
}
// 购买会员
Me.prototype.buyVip = function(type) {
  this.con.sendCmd("CMD_GENERAL_NOTIFY", {
    type: GenNo.NOTIFY_BUY_INSIDER,
    para1: type+"",
    para2: ""
  });
};

//去降妖
Me.prototype.GoXiangYao = function(type) {
  this.instruction.setType("xiangyao")
}
Me.prototype.trace = function(info) {
  if (!cfg.enableTrace) return;

  console.log("[" + os.uptime() + "][" + this.data.name + "] " + info);
};

module.exports = {
  create: function(client) {
    return new Me(client);
  }
};
