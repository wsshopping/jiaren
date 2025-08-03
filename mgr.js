// mgr.js
// Created by yuhx Mar/04/2019
// 公共管理器

var os = require("os");
var DES = require("./lib/des.js");
var MapInfo = require("./MapInfo.js");

module.exports.init = function() {
  this.mapInfoEx = {}; // 以地图名字为 key 的地图数据
  this.npcInfo = {}; // npc
  this.npcInfoEx = {}; // 地图中的 npc

  for (var mapId in MapInfo) {
    if (!(MapInfo[mapId]["npc"] instanceof Object)) continue;

    if (!(this.npcInfoEx[mapId] instanceof Object)) this.mapInfoEx[MapInfo[mapId]["map_name"]] = Object.assign({ mapId: mapId }, MapInfo[mapId]);
    else console.log(MapInfo[mapId]["map_name"]);

    if (!(this.npcInfoEx[mapId] instanceof Object)) this.npcInfoEx[mapId] = {};

    for (var id in MapInfo[mapId]["npc"]) {
      var val = MapInfo[mapId]["npc"][id];
      if (!(val instanceof Object)) continue;

      var temp = Object.assign(
        {
          mapId: mapId,
          mapName: MapInfo[mapId]["map_name"],
          x: val["x"],
          y: val["y"],
          name: val["name"],
          alias: val["alias"]
        },
        val
      );

      if (val["alias"] instanceof String) this.npcInfoEx[mapId][val["alias"]] = temp;
      else this.npcInfoEx[mapId][val["name"]] = temp;

      if (this.npcInfo[val["name"]] instanceof Object)
        // 已经有了
        continue;

      this.npcInfo[val["name"]] = temp;
    }
  }
};

// 正则表达式
module.exports.regularMatch = function(str, regular) {
  var val = str.match(regular);

  if (val instanceof Array) return val[1];

  return;
};

// 查找地图信息
module.exports.getMapByName = function(name) {
  return this.mapInfoEx[name];
};

// 查找 npc 信息
module.exports.getNpcByName = function(name, mapId) {
  // 优先匹配mapInfo中配置的 name
  if (this.npcInfo[name] instanceof Object) return this.npcInfo[name];

  // 当前地图有此 NPC
  if (this.npcInfoEx[mapId] instanceof Object && this.npcInfoEx[mapId][name] instanceof Object) {
    return this.npcInfoEx[mapId][name];
  }

  for (var mapId in this.npcInfoEx) {
    if (this.npcInfoEx[mapId] instanceof Object && this.npcInfoEx[mapId][name] instanceof Object) {
      return this.npcInfoEx[mapId][name];
    }
  }
};

// 解析 NPC 菜单内容
module.exports.parseMenu = function(content) {
  var list = content.split("][");
  var ret = {};
  var pos1, pos2;

  pos1 = -1;
  while (true) {
    pos1 = content.indexOf("[", pos1 + 1);
    if (pos1 < 0) break;

    do {
      pos2 = content.indexOf("[", pos1 + 1);
      pos3 = content.indexOf("]", pos1 + 1);
      if (pos2 > 0 && pos2 < pos3) {
        pos1 = pos2;
      } else {
        if (pos3 > pos1) str = content.slice(pos1 + 1, pos3);
        else str = content.slice(pos1 + 1);

        var arr = str.split("/");
        if (arr.length > 1) {
          ret[arr[0]] = arr[1];
        } else {
          ret[arr[0]] = arr[0];
        }

        break;
      }
    } while (true);
  }

  return ret;
};

// 获取调用信息
module.exports.getCallerFileNameAndLine = function(val) {
  function getException() {
    try {
      throw Error("");
    } catch (err) {
      return err;
    }
  }

  const err = getException();
  const stack = err.stack;
  const stackArr = stack.split("\n");

  console.log(val);
  console.log(stackArr[3]);

  if (stackArr.length > 4) {
    console.log(stackArr[4]);
  }
};

// 加密
module.exports.encrypt = function(text, rawKey, cb) {
  var key = DES.d3MakeKey(rawKey);
  var des = DES.create(key);
  var out = des.encrypt(text);
  cb(null, out);
};
