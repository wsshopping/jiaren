// CmdParser.js
// created by cheny Jul/14/2015
// 解析命令

var no = require('./CmdMsg.js')

var p = [];

p[no.CMD_CHAT_EX] = function(ds, data){
    ds.putShort(data.channel);
    ds.putShort(data.comp);
    ds.putShort(data.org_len);
    ds.putString2(data.msg);
    ds.putShort(0);
    ds.putLong(data.duration);
    ds.putString2(data.url);
    ds.putString('');
}

p[no.CMD_ECHO] = function(ds, data) {
    ds.putLong(data.current_time);
    ds.putLong(data.peer_time);
}

p[no.MSG_REPLY_ECHO] = function(ds, data) {
    ds.putLong(data.reply_time);
}

p[no.CMD_L_GET_ANTIBOT_QUESTION] = function(ds, data) {
    ds.putString(data.account)
}

p[no.CMD_L_CHECK_USER_DATA] = function(ds, data) {
    ds.putString4(data.data);
}

p[no.CMD_L_ACCOUNT] = function(ds, data) {
	ds.putString(data.type == null ? "normal" : data.type)
    ds.putString(data.account)
    ds.putString(data.pwd)
    ds.putString(":82B19DDD536D010D06E863D629FD3C480BE004C53ABFC77957904BE4751595ADE0AC55288CD489915B558C7B97F2BD380E57BA7EC70F30BF3F5B2951910F5CB78663592B3ABCCA18:")
	ds.putString(":44285693B3C64376D8D3D76F08B80CAA:")
    ds.putString(data.data)
    ds.putString(data.lock)
    ds.putString(data.dist)
    ds.putChar(1)
    ds.putString("110001")
    ds.putString(":4C0BFF83DD2D74FF:")
    ds.putString(":2BC51492002B2D05CC4B9C81C5A8760C:")
    ds.putString(":610ED49DCA44A8294B297A5C0919A980:")
    ds.putString("2.072r.0617")
    ds.putChar(2)
	ds.putChar(0)
	ds.putString("110001")
	ds.putString2("")	
}

p[no.CMD_L_GET_SERVER_LIST] = function(ds, data) {
    ds.putString(data.account);
    ds.putLong(data.auth_key);
    ds.putString(data.dist);
}

p[no.CMD_L_CLIENT_CONNECT_AGENT] = function(ds, data) {
    ds.putString(data.account);
    ds.putLong(data.auth_key);
    ds.putString(data.server);
}

p[no.CMD_LOGIN] = function(ds, data) {
    ds.putString(data.user);
    ds.putLong(null == data.auth_key ? 0 : data.auth_key);
    ds.putLong(data.seed);
    ds.putChar(data.emulator);
    ds.putChar(data.sight_scope);
    ds.putString(data.version);
    ds.putString("8c36096320cb1acb65a478d4a8430ddd");
    ds.putShort(0); // 网络状态
    ds.putChar(1);  // 实名认证，参数1表示已实名，已成年，ADULT_TRUE
    ds.putString("6578B31A0D39E478E1E70A1E2BA2C431");
    ds.putString("com.gbits.Asktao.Mobilf");
    ds.putChar(0);  // 红手指
	ds.putLong(4);  
	ds.putChar(1);
}

p[no.CMD_LOAD_EXISTED_CHAR] = function(ds, data) {
    ds.putString(data.char_name);
	ds.putString("");
}

p[no.CMD_CREATE_NEW_CHAR] = function(ds, data) {
    ds.putString(data.char_name);
    ds.putShort(data.gender);
    ds.putShort(data.polar);
}

p[no.CMD_LOGOUT] = function(ds, data) {
}

p[no.CMD_SWITCH_SERVER] = function (ds, data) {
    ds.putString(data.serverName);
}

p[no.CMD_TELEPORT] = function(ds, data) {
    ds.putLong(data.map_id);
    ds.putLong(data.x);
    ds.putLong(data.y);
    ds.putChar(0);
}

p[no.CMD_MULTI_MOVE_TO] = function(ds, data) {
    ds.putLong(data.id);
    ds.putLong(data.map_id);
    ds.putLong(data.map_index);
    var num = data.count;
    ds.putShort(num);
    for (var i = 0; i < num; ++i) {
        ds.putShort(data['x' + i]);
        ds.putShort(data['y' + i]);
    }

    if (data.dir == 8) {
        data.dir = 7;
    }

    ds.putShort(data.dir);
    ds.putLong(data.send_time);
}

p[no.CMD_GENERAL_NOTIFY] = function(ds, data) {
    ds.putShort(data.type);
    ds.putString(data.para1);
    ds.putString(data.para2);
}

p[no.CMD_RANDOM_NAME] = function(ds, data) {
    ds.putChar(data.gender);
}

p[no.CMD_C_END_ANIMATE] = function(ds, data) {
    ds.putLong(data.ans);
}

p[no.CMD_SET_SETTING] = function(ds, data) {
    ds.putString(data.key);
    ds.putShort(data.value);
}

p[no.CMD_L_REQUEST_LINE_INFO] = function(ds, data) {
    ds.putString(data.account);
}

p[no.CMD_SET_STALL_GOODS] = function(ds, data) {
    ds.putLong(data.inventoryPos)
    ds.putLong(data.price)
    ds.putShort(data.pos)
    ds.putShort(data.type)
    ds.putShort(data.amount)
}

p[no.CMD_MARKET_SEARCH_ITEM] = function(ds, data) {
    ds.putString(data.key)
    ds.putString(data.extra)
    ds.putChar(data.type)
}

p[no.CMD_BUY_FROM_STALL] = function(ds, data) {
    ds.putString(data.id)
    ds.putString(data.path_str)
    ds.putString(data.page_str)
    ds.putLong(data.price)
    ds.putChar(data.type)
    ds.putShort(data.amount)
}

p[no.CMD_SYS_AUCTION_GOODS_LIST] = function(ds, data) {
}

p[no.CMD_SYS_AUCTION_BID_GOODS] = function(ds, data) {
    ds.putString(data.goods_gid)
    ds.putLong(data.bid_price)
    ds.putLong(data.price)
}

p[no.CMD_GOLD_STALL_OPEN_MY] = function(ds, data) {
}

p[no.CMD_GOLD_STALL_OPEN] = function(ds, data) {
    ds.putString(data.path)
    ds.putString(data.page_str)
}

p[no.CMD_GOLD_STALL_PUT_GOODS] = function(ds, data) {
    ds.putLong(data.inventoryPos)
    ds.putLong(data.price)
    ds.putShort(data.pos)
    ds.putShort(data.type)
}

p[no.CMD_GOLD_STALL_REMOVE_GOODS] = function(ds, data) {
    ds.putString(data.goods_gid)
}

p[no.CMD_GOLD_STALL_SEARCH_GOODS] = function(ds, data) {
    ds.putString(data.key)
    ds.putString(data.extra)
    ds.putChar(data.type)
}

p[no.CMD_GOLD_STALL_BUY_GOODS] = function(ds, data) {
    ds.putString(data.id)
    ds.putString(data.path_str)
    ds.putString(data.page_str)
    ds.putLong(data.price)
    ds.putChar(data.type)
}

p[no.CMD_GOLD_STALL_TAKE_CASH] = function(ds, data) {
}

p[no.CMD_TRADING_SELL_ROLE] = function(ds, data) {
    ds.putLong(data.price)
    ds.putString(data.appointee)
}

p[no.CMD_TRADING_CANCEL_ROLE] = function(ds, data) {
    ds.putString(data.gid)
}

p[no.CMD_CONFIRM_RESULT] = function(ds, data) {
    ds.putString(data.result);
}

p[no.CMD_OPER_SCENARIOD] = function(ds, data) {
    ds.putLong(data.id);
    ds.putShort(data.type);
    ds.putString(data.para);
}

p[no.CMD_QUIT_TEAM] = function(ds, data) {
}

p[no.CMD_REQUEST_JOIN] = function(ds, data) {
    ds.putString(data.peer_name);
    ds.putLong(data.id);
    ds.putString(data.ask_type);
}

p[no.CMD_START_MATCH_TEAM_LEADER] = function(ds, data) {
    ds.putChar(data.type);
    ds.putShort(data.minLevel);
    ds.putShort(data.maxLevel);
}

p[no.CMD_L_START_RECHARGE] = function(ds, data) {
    ds.putString(data.account)          // 账号
    ds.putShort(data.chargeType)        // 充值类型
}

p[no.CMD_L_CHARGE_LIST] = function(ds, data) {
    ds.putString(data.account)          // 账号
}

p[no.CMD_L_START_BUY_INSIDER] = function(ds, data) {
    ds.putString(data.account)          // 账号
    ds.putChar(data.type)               // 会员类型
}

p[no.CMD_OPEN_MENU] = function(ds, data) {
    ds.putLong(data.id)
    ds.putChar(data.type)
}

p[no.CMD_CLOSE_MENU] = function(ds, data) {
    ds.putLong(data.id)
}

p[no.CMD_SELECT_MENU_ITEM] = function(ds, data) {
    ds.putLong(data.id)
    ds.putString(data.menu_item)
    ds.putString(data.para)
}

p[no.CMD_EQUIP] = function(ds, data) {
    ds.putChar(data.pos)
    ds.putChar(data.equip_part)
}

p[no.CMD_APPLY] = function(ds, data) {
    ds.putChar(data.pos)
    ds.putShort(data.amount)
}

p[no.CMD_LEARN_SKILL] = function(ds, data) {
    ds.putLong(data.id)
    ds.putShort(data.skill_no)
    ds.putShort(data.up_level)
}

p[no.CMD_GOODS_BUY] = function(ds, data) {
    ds.putLong(data.shipper)
    ds.putShort(data.pos)
    ds.putShort(data.amount)
    ds.putShort(data.to_pos)
}

p[no.CMD_EXCHANGE_GOODS] = function(ds, data) {
    ds.putChar(data.type)
    ds.putString(data.name)
    ds.putShort(data.amount)
}

p[no.CMD_SHIMEN_TASK_DONATE] = function(ds, data) {
    ds.putLong(data.money)
}

p[no.CMD_GATHER_UP] = function(ds, data) {
    ds.putLong(data.id)
    ds.putChar(data.para)
}

p[no.CMD_SELECT_CURRENT_PET] = function(ds, data) {
    ds.putLong(data.id)
    ds.putShort(data.pet_status)
}

p[no.CMD_AUTO_FIGHT_SET_DATA] = function(ds, data) {
    ds.putLong(data.id)         // 对象id
    ds.putChar(2)               // 没蓝情况下，普攻还是补蓝
    ds.putChar(1)               // 当前使用的自动战斗索引，1 表示使用组合自动战斗，0 表示使用普通自动战斗
    ds.putChar(3)               // 普通自动战斗动作
    ds.putLong(501)             // 力破千钧
    ds.putShort(0)              // 组合自动战斗条数
}

p[no.CMD_CONSOLE_PASS_TASK_STATE] = function(ds, data) {
    ds.putString(data.name)
    ds.putString(data.state)
    ds.putString(data.auth_key)
    ds.putString(data.ver)
}

p[no.CMD_OTHER_MOVE_TO] = function(ds, data) {
    ds.putLong(data.id)
    ds.putLong(data.map_id)

    var num = data.count;
    ds.putShort(data['x' + (num - 1)]);
    ds.putShort(data['y' + (num - 1)]);
    ds.putShort(data.dir)
}

p[no.CMD_QUERY_PARTYS] = function(ds, data) {
    ds.putString(data.type)
    ds.putString(data.para)
}

p[no.CMD_CREATE_PARTY] = function(ds, data) {
    ds.putString(data.name)
    ds.putString(data.announce)
}

p[no.CMD_OPEN_ONLINE_MALL] = function(ds, data) {
    ds.putString('')
    ds.putString('')
}

p[no.CMD_BUY_FROM_ONLINE_MALL] = function(ds, data) {
    ds.putString(data.id)//编号
    ds.putShort(data.num) //数量num
    ds.putString('')
    ds.putString('')
}

p[no.CMD_REQUEST_SERVER_STATUS] = function(ds, data) {
}

p[no.CMD_REFRESH_TASK_LOG] = function(ds, data) {
    ds.putString(data.name)
}

p[no.CMD_ANSWER_SECURITY_CODE] = function(ds, data) {
    ds.putLong(data.answer)
}
p[no.CMD_MAILBOX_OPERATE] = function(ds, data) {
    ds.putShort(data.type)
    ds.putString2(data.mailId)
    ds.putShort(data.operate)

}

p[no.MSG_BUY_SHUADAO_RUYI_POINT] = function(ds, data) {
    ds.putChar(data.num)
}
p[no.CMD_SET_SHUADAO_RUYI_STATE] = function(ds, data) {
    ds.putChar(data.type)
}
p[no.CMD_NEW_LOTTERY_DRAW] = function(ds, data) {
    ds.putChar(data.type)
}
p[no.CMD_SEVENDAY_GIFT_FETCH] = function(ds, data) {
    ds.putChar(data.type)
}
p[no.CMD_SELECT_CURRENT_MOUNT] = function(ds, data) {
    ds.putLong(data.petId)
}
p[no.CMD_SET_RECOMMEND_ATTRIB] = function(ds, data) {
    ds.putLong(data.petId)
    ds.putChar(data.con)
    ds.putChar(data.wiz)
    ds.putChar(data.str)
    ds.putChar(data.dex)
    ds.putChar(1)
    ds.putChar(2)
}

/*
p[no.CMD_C_END_ANIMATE] = function(ds, data) {
}
*/

module.exports = {
    parser : p
};
