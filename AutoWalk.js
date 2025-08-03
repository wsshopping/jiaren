// AutoWalk.js
// Created by yuhx Mar/05/2019
// 自动寻路

var os      = require('os');
var cfg     = require('./cfg.js');
var Const   = require('./Const.js');
var mgr     = require('./mgr.js');

var TRUE = true
var FALSE = false
var NULL = null

var AUTO_WALK_MAGIC_KEY = "auto_walk"           // 自动寻路标记
var AUTO_WALK_END_MAGIC_KEY = "auto_walk_end"   // 自动寻路结束标记
var AUTO_WALK_ACTION_TALK = "$0"                // 自动对话
var AUTO_WALK_ACTION_RAND = "$1"                // 随机走动
var AUTO_WALK_ACTION_STOP = "$2"                // 停下
var RANDOM_WALK_MAGIC_KEY = "random_walk"       // 巡逻寻路标记
var AUTO_WALK_ACTION_TALK_SCOPE_MIN = 2         // 自动对话的最小范围
var AUTO_WALK_ACTION_TALK_SCOPE_MAX = 6         // 自动对话的最大范围

function AutoWalk(me) {
    if (! (this instanceof AutoWalk))
        return new AutoWalk(me);

    this.me = me;
}

// 是否可以自动寻路
AutoWalk.prototype.checkCanAutoWalk = function() {
    if (this.me.inCombat)
        return false;

    return true;
}

//  获取地图 地点
AutoWalk.prototype.getMapInfo = function(position, dest) {
    var tempObj = null;

    tempObj = /(.*)\((\d+),\s*(\d+)\)/g.exec(position);
    if (tempObj && tempObj[1].length > 0)
    {
        dest.map    = tempObj[1];
        dest.x      = parseInt(tempObj[2]);
        dest.y      = parseInt(tempObj[3]);
    } else
    {
        dest.map    = position;
        if (position == this.me.getCurrentMapName())
        {
            dest.x  = this.me.data.x;
            dest.y  = this.me.data.y;
        }
    }
}

// 获取符合条件的路径
AutoWalk.prototype.getMapDest = function(destStr) {
    var dest    = {};
    var strList = [];
    var tempStr = null;
    var tempObj = null;
    var i;

    if (tempStr = mgr.regularMatch(destStr, "#P(.+)#P"))
    {
        // #P#P 格式
        strList   = tempStr.split("|");     // |先分割出的队列

        dest.npc    = strList[0];           // npc 名字
        dest.action = AUTO_WALK_ACTION_TALK;

        if (tempObj = mgr.getNpcByName(strList[0], 0))
        {
            dest.map = tempObj.mapName;
        }

        for (i = 1; i < strList.length; ++i)
        {
            tempObj = (/\$\d+/g.exec(strList[i]))
            if ((tempObj instanceof Object) &&
                (tempObj.index == 0))
            {
                dest.action = strList[i];
            } else
            if ((tempObj = /^(\d+)线$/g.exec(strList[i])) &&
                (tempObj instanceof Object) &&
                (tempObj.index == 0))
            {
                dest["area"] = strList[i];
            } else
            if (tempStr = mgr.regularMatch(strList[i], "M=(.+)"))
            {
                var keys = tempStr.split("&");
                dest.autoClickKeys = keys;
                dest.msgIndex = tempStr;
            } else
            if (tempStr = mgr.regularMatch(strList[i], "E=(.+)"))
            {
                var keys = tempStr.split("&");
                dest.autoClickKeys = keys;
                dest.effectIndex = keys[keys.length - 1];
            } else
            if (tempStr = mgr.regularMatch(strList[i], "H=(.+)"))
            {
                dest.homeInfo = tempStr;
            } else
            if (tempStr = mgr.regularMatch(strList[i], "Tip=(.+)"))
            {
                dest.tipText = tempStr;
            } else
            if (tempStr = mgr.regularMatch(strList[i], "Tip_ex=(.+)"))
            {
                dest.tipCmd = tempStr;
            } else
            if (tempObj = strList[i].match("(.*)::(.*)"))
            {
                dest.npc = tempObj[2];
                this.getMapInfo(tempObj[1], dest);
            } else
            {
                this.getMapInfo(strList[i], dest);
                if ((dest.x && dest.y) || mgr.getMapByName(strList[i]))
                {
                    // 地图
                    dest.npc = strList[0];
                } else
                if (tempObj = mgr.getNpcByName(strList[i], this.me.data.map_id))
                {
                    dest.npc    = strList[i];
                    dest.map    = tempObj.mapName;
                    dest.x      = tempObj.x;
                    dest.y      = tempObj.y;
                }
            }
        }
    } else
    if (tempStr = mgr.regularMatch(destStr, "#Z(.+)#Z"))
    {
        strList   = tempStr.split("|");     // |先分割出的队列

        dest.action = AUTO_WALK_ACTION_STOP;

        this.getMapInfo(strList[0], dest);

        for (i = 1; i < strList.length; ++i)
        {
            tempObj = (/\$\d+/g.exec(strList[i]))
            if ((tempObj instanceof Object) &&
                (tempObj.index == 0))
            {
                dest.action = strList[i];
            } else
            if ((tempObj = /^(\d+)线$/g.exec(strList[i])) &&
                (tempObj instanceof Object) &&
                (tempObj.index == 0))
            {
                dest["area"] = strList[i];
            } else
            if (tempStr = mgr.regularMatch(strList[i], "M=(.+)"))
            {
                var keys = tempStr.split("&");
                dest.autoClickKeys = keys;
                dest.msgIndex = tempStr;
            } else
            if (tempStr = mgr.regularMatch(strList[i], "E=(.+)"))
            {
                var keys = tempStr.split("&");
                dest.autoClickKeys = keys;
                dest.effectIndex = keys[keys.length - 1];
            } else
            if (tempStr = mgr.regularMatch(strList[i], "H=(.+)"))
            {
                dest.homeInfo = tempStr;
            } else
            if (tempStr = mgr.regularMatch(strList[i], "Tip=(.+)"))
            {
                dest.tipText = tempStr;
            } else
            if (tempStr = mgr.regularMatch(strList[i], "Tip_ex=(.+)"))
            {
                dest.tipCmd = tempStr;
            } else
            if (tempObj = strList[i].match("(.*)::(.*)"))
            {
                dest.npc = tempObj[2];

                if (tempObj[1].length > 0)
                {
                    this.getMapInfo(tempObj[1], dest);
                } else
                if (tempObj = mgr.getNpcByName(dest.npc, this.me.data.map_id))
                {
                    dest.map    = tempObj.mapName;
                    dest.x      = tempObj.x;
                    dest.y      = tempObj.y;
                }
            } else
            {
                this.getMapInfo(strList[i], dest);
            }
        }
    }

    return dest;
}

// 获取寻路信息
AutoWalk.prototype.getDest = function(str) {
    var tempStr = str;
    var dest = {}

    if (! tempStr)
        return null;

    // 目的地队列
    tempStr = mgr.regularMatch(tempStr, ".*(#[PZ].+#[PZ]).*");
    if (! tempStr)
        return null;

    var destList = tempStr.split("@");

    if (destList.length > 1)
    {
        // "#Z揽仙454|揽仙镇(35,105)::多闻道人|$0@P多闻道人126|揽仙镇(35,105)::多闻道人|$0|M=离开#Z"
        // @后面P或者Z表示 后面是#P或#Z(把#P#补全)
        destList[0] = destList[0] + destList[0].substr(0, 2);
        destList[1] = "#" + destList[1].slice(0, -2);
        destList[1] = destList[1] + destList[1].slice(0, 2);
        dest        = this.getMapDest(destList[0]);

        if (dest["map"] != this.me.getCurrentMapName())
        {
            dest = this.getMapDest(destList[1]);
            dest.hasNext = str;
        }

    } else
    {
        dest = this.getMapDest(destList[0]);
    }

    if (Object.keys(dest).length == 0)
        return null;

    return dest;
}

// 随机移动
AutoWalk.prototype.randomWalk = function(mapId, x, y) {
    var my = this;

    if (! this.randomWalking)
        return;

    if (this.me.inCombat)
        return;

    this.me.moveToAround(8);

    setTimeout(function() {
        my.randomWalk(mapId, x, y);
    }, 3000);
}

// 自动寻路到某个npc或地图坐标
// 注：自动寻路家具的目的地坐标不是放置家具的位置而是家具脚底基准点对应地图的位置
AutoWalk.prototype.beginAutoWalk = function(dest) {
    if (! (dest instanceof Object))
        // 不是一个对象
        return;

    if (! this.checkCanAutoWalk())
        // 当前不允许寻路
        return

    // 重置下一段寻路
    this.hasNext = null;

    if (dest.map != null && dest.map != this.me.getCurrentMapName())
    {
        if (tempObj = mgr.getMapByName(dest.map))
        {
            // 尝试发送飞行指令
            this.me.enterMap(tempObj.mapId);

            // 发送飞行消息成功，保存寻路信息
            this.autoWalk = dest;
            this.randomWalking = false;
        }

        return;
    }

    if (dest.npc != null)
    {
        var npc = null;
        if (dest.x && dest.y)
        {
            npc = {
                'x'     : dest.x,
                'y'     : dest.y,
                'name'  : dest.npc,
            };
        } else
        {
            npc = mgr.getNpcByName(dest.npc, this.me.data.map_id);
        }

        if (npc)
        {
            // 存在 NPC 信息
            var dis = this.me.distance(this.me.data.x, this.me.data.y, npc.x, npc.y);

            if (Math.floor(dis) <= AUTO_WALK_ACTION_TALK_SCOPE_MAX)
            {
                this.me.setEndPos(this.me.data.x, this.me.data.y);
                this.autoWalk = dest;
                this.autoWalk.is_walking = true;
                this.randomWalking = false;
                dest.rawX = npc.x;
                dest.rawY = npc.y;
                this.doAutoWalkEnd(true);
                return;
            }

            // 寻路到npc
            dest.rawX = npc.x;
            dest.rawY = npc.y;
            dest.x = npc.x;
            dest.y = npc.y;
        }
    }

    this.me.trace('[beginAutoWalk]setEndPos x:' + dest.x + ', y:' + dest.y);

    // 设置寻路终点
    this.me.setEndPos(dest.x, dest.y);

    // 保存自动寻路信息，设置正在自动寻路
    this.autoWalk = dest
    this.autoWalk.is_walking = true
    this.randomWalking = false;
    if (this.me.data.x == dest.x && this.me.data.y == dest.y)
    {
        // 如果当前位置为寻路位置
        if (dest.action == AUTO_WALK_ACTION_RAND)
        {
            this.randomWalking = true;
            this.randomWalk(this.me.map_id, dest.x, dest.y);
            return;
        }

        // 如果寻路的点与当前位置一致则随机一步再回来，让服务器继续出发剧情
        this.me.randomSomePosAndBack()

        // 处理寻路完成后事件
        this.doAutoWalkEnd(true)

        this.endAutoWalk()

        return;
    }
}

// 检查过图自动寻路
AutoWalk.prototype.enterRoomContinueAutoWalk = function()
{
    // 检查是否有自动寻路
    if (this.autoWalk)
    {
        setTimeout(this.continueAutoWalk.bind(this), 1000);
    }
}

// 是否已经到达目的地
AutoWalk.prototype.isAutoWalkArrived = function() {
    if (! this.autoWalk)
        return false;

    return this.autoWalk.x == this.me.data.x && this.autoWalk.y == this.me.data.y;
}

// 移动消息
AutoWalk.prototype.onMoved = function() {
    if (this.isAutoWalkArrived())
    {
        // 处理寻路完成后事件
        this.doAutoWalkEnd(true)

        this.endAutoWalk()
    }
}

// 继续自动寻路直到寻路结束
AutoWalk.prototype.continueAutoWalk = function()
{
    if (! this.me.teamData)
        return;

    var member = this.me.teamData[this.me.data.id];
    if (member && member.index != 0) {
        // 队员不需要寻路
        return;
    }

    this.beginAutoWalk(this.autoWalk);
}

// 寻路结束的回调
AutoWalk.prototype.doAutoWalkEnd = function(noShow) {
    if (! this.autoWalk)
        return;

    if (this.autoWalk.hasNext)
    {
        // 需要继续下一段寻路
        this.hasNext = this.autoWalk.hasNext;
    }

    if (this.autoWalk.action == AUTO_WALK_ACTION_TALK)
    {
        var npc = this.autoWalk.npc;
        if (this.autoWalk["autoClickKeys"])
        {
            this.autoClickKeys = this.autoWalk["autoClickKeys"];
        }

        this.talkToNpc(npc, this.autoWalk.rawX, this.autoWalk.rawY);
    } else
    if (this.autoWalk.action == AUTO_WALK_ACTION_RAND)
    {
        this.randomWalking = true;
        this.randomWalk(this.me.map_id, this.autoWalk.x, this.autoWalk.y);
    }
}

// 与 NPC 对话
AutoWalk.prototype.talkToNpc = function(name, posx, posy)
{
    if (name == null)
        return false;

    for (var id in this.me.appearData)
    {
        var data = this.me.appearData[id];

        if (data['name'] == name && data['x'] == posx && data['y'] == posy)
        {
            this.me.talkNpcId = id;

            if (data.type == Const.OBJECT_TYPE.GATHER)
            {
                this.me.con.sendCmd('CMD_GATHER_UP', {id : id, para : 0 });
            } else
            {
                this.me.con.sendCmd('CMD_OPEN_MENU', {id : id, type : 0 });
            }

            break;
        }
    }
}

// npc 对话
AutoWalk.prototype.onMenuList = function(id, menuList) {
    var arr = Object.keys(menuList);

    if (arr.length == 0)
        return false;

    if (! this.autoClickKeys)
    {
        return false;
    }

    for (var i in this.autoClickKeys)
    {
        if (! this.autoClickKeys[i])
            continue;

        var list = this.autoClickKeys[i].split('::');
        if (menuList[list[0]])
        {
            // 移除该项
            this.autoClickKeys[i] = null;
            var a = menuList[list[0]];
            if(a === "扫荡帮派任务#TIP:1"){
                a = "扫荡帮派任务";
            }
            if(a === "扫荡#TIP:1"){
                a = "扫荡";
            }
            // 发送消息给服务器
            this.me.selectMenuItem({ id : id, menu_item : a, para : '' });
            return true;
        }
    }

    this.autoClickKeys = null;
    return false;
}

// 结束自动寻路
AutoWalk.prototype.endAutoWalk = function() {
    this.autoWalk = null;
}

module.exports = {
    create : function(me) { return new AutoWalk(me); },
}
