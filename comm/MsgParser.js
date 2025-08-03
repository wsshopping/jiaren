// MsgParser.js
// created by cheny Jul/23/2015
// 消息编号

var no              = require('./CmdMsg.js')
var gDynamicFields  = require('./Fields.js')

var FIELD_INT8          = 1 // 8bits signed byte
var FIELD_INT16         = 2 // 16bits signed short
var FIELD_INT32         = 3 // 32bits signed long
var FIELD_STRING        = 4 // len(8-bits) - string
var FIELD_LONG_STRING   = 5 // len(16-bits) - string
var FIELD_UINT8         = 6 // 8bits unsigned byte
var FIELD_UINT16        = 7 // 16bits unsigned short

var FIELDS_BASIC        = 1 // 物品基础属性值
var FIELDS_VALUE        = 2 // 物品加成属性值
var FIELDS_SCALE        = 3 // 物品加成百分比

// 动态字段
function buildFields(data, ds, suffix) {
    var count = ds.getShort();
    for (var i = 0; i < count; ++i) {
        var key = gDynamicFields[ds.getShort()];
        if (suffix) {
            key = key + suffix;
        }

        if (key) {
            var type = ds.getChar();
            if (type == FIELD_INT8) {
                data[key] = ds.getSignedChar();
            } else if (type == FIELD_UINT8) {
                data[key] = ds.getChar();
            } else if (type == FIELD_INT16) {
                data[key] = ds.getSignedShort();
            } else if (type == FIELD_UINT16) {
                data[key] = ds.getShort();
            } else if (type == FIELD_INT32) {
                data[key] = ds.getSignedLong();
            } else if (type == FIELD_STRING) {
                data[key] = ds.getString();
            } else if (type == FIELD_LONG_STRING) {
                data[key] = ds.getString2();
            }
        }
    }
}

// 构造一个物品信息
function buildItemInfo(data, ds, suffix) {
    var extra = {}
	var groupCount = ds.getShort()
    for (var i = 0; i < groupCount; ++i) {
		var groupNo = ds.getChar()
		var groupType = ds.getChar()
		if (groupType == FIELDS_BASIC) {
			buildFields(data, ds)
		} else {
			var suffix
			if (groupType == FIELDS_VALUE) {
				suffix = "_" + groupNo
			} else if (groupType == FIELDS_SCALE) {
				suffix = "_scale_" + groupNo
			}

			extra["" + groupNo + "_group"] = 1
			buildFields(extra, ds, suffix)
        }
    }
	data.extra = extra
}

// 构造一个技能信息
function buildSkillBasicInfo(data, ds) {
    data.skill_no = ds.getShort()
    data.skill_attrib = ds.getShort()
    data.skill_level = ds.getShort()
    data.level_improved = ds.getShort()
    data.skill_mana_cost = ds.getShort()
    data.range = ds.getShort()
    data.max_range = ds.getShort()

    // 获取消耗信息
    var count = ds.getShort()
    for (var i = 0; i < count; ++i) {
        data['cost_' + ds.getString()] = ds.getLong()
    }
}

// 构造宠物信息
function buildPetInfo(data, ds) {
    var count = ds.getShort()
    var j = 1
    for (var i = 0; i < count; ++i) {
        var no = ds.getChar()
        var type = ds.getChar()
		if (type == FIELDS_BASIC) {
            buildFields(data, ds)
        } else {
            var groupData = { no : no }
            buildFields(groupData, ds)
            data['group_' + j] = groupData

            j = j + 1
        }
    }

    data.group_num = j - 1
}

var p = [];

// 服务器也会发该命令
p[no.CMD_ECHO] = function(data, ds) {
    data.peer_time = ds.getLong();
    data.last_time = ds.getLong();
}

p[no.MSG_REPLY_ECHO] = function(data, ds) {
    data.peer_time = ds.getLong();
}

p[no.MSG_L_ANTIBOT_QUESTION] = function(data, ds) {
    data.question = ds.getString4();
}

p[no.MSG_L_CHECK_USER_DATA] = function(data, ds) {
    data.result = ds.getLong();
    data.cookie = ds.getString();
}

p[no.MSG_L_AUTH] = function(data, ds) {
    data.type = ds.getString();
    data.result = ds.getLong();
    data.auth_key = ds.getLong();
    data.msg = ds.getString2();
}

p[no.MSG_L_SERVER_LIST] = function(data, ds) {
    data.count = ds.getShort();
    for (var i = 0; i < data.count; ++i) {
		data['id' + i] = ds.getShort();
        data['server' + i] = ds.getString()
        data['ip' + i] = ds.getString()
    }

    for (var i = 0; i < data.count; ++i) {
        data['status' + i] = ds.getShort()
    }
}
//周年版本 要解密
// p[no.MSG_L_AGENT_RESULT] = function(data, ds) {
// 	let auth_key1 = ds.getShort();
// 	data.result = ds.getLong();
//     data.privilege = ds.getLong();
//     data.ip = ds.getString();
//     data.port = ds.getShort();
//     data.seed = ds.getLong();
// 	let key = ds.getShort();
// 	key = key ^ 1;
// 	data.serverName = ds.getString();
// 	data.port = key ^ data.port;
// 	auth_key1 = auth_key1.toString(16).padStart(4, '0');
//     key = key.toString(16).padStart(4, '0');
// 	let auth_key = auth_key1 + key;
// 	data.authKey = parseInt(auth_key, 16);
// 	data.serverStatus = ds.getChar();
// 	data.msg = ds.getString();
// }
//

//83Java不用解密
p[no.MSG_L_AGENT_RESULT] = function(data, ds) {
    let auth_key1 = ds.getShort();
    data.result = ds.getLong();
    data.privilege = ds.getLong();
    data.ip = ds.getString();
    data.port = ds.getShort();
    data.seed = ds.getLong();
    let key = ds.getShort();
    key = key ^ 1;
    data.serverName = ds.getString();
    data.port = key ^ data.port;
    auth_key1 = auth_key1.toString(16).padStart(4, '0');
    key = key.toString(16).padStart(4, '0');
    let auth_key = auth_key1 + key;
    data.authKey = parseInt(auth_key, 16);
    data.serverStatus = ds.getChar();
    data.msg = ds.getString();
    data.result = "1"

}

p[no.MSG_ANSWER_FIELDS] = function(data, ds) {
    var num = ds.getShort();
    for (var i = 0; i < num; ++i) {
        gDynamicFields[ds.getShort()] = ds.getString();
    }
}

p[no.MSG_EXISTED_CHAR_LIST] = function(data, ds) {
    data.severState = ds.getShort();
    data.count = ds.getShort();
    for (var i = 0; i < data.count; ++i) {
        var info = {};
        buildFields(info, ds);
        data[i] = info;
    }

    data.openServerTime = ds.getLong();
    data.account_online = ds.getChar();
}

p[no.MSG_SWITCH_SERVER] = function (data, ds) {
    data.result = ds.getShort();
    data.msg = ds.getString();
}

p[no.MSG_SWITCH_SERVER_EX] = function (data, ds) {
    data.result = ds.getShort();
    data.msg = ds.getString();
}

// 跨服换线
p[no.MSG_SPECIAL_SWITCH_SERVER_EX] = function (data, ds) {
    data.result = ds.getChar();
    data.msg = ds.getString();
}

p[no.MSG_ENTER_GAME] = function(data, ds) {
    data.flag = ds.getShort();
    data.dist = ds.getString();
    data.name = ds.getString();
    data.time = ds.getLong();
    data.lineNum = ds.getShort()
    data.corss_server_dist = ds.getChar()
    data.time_zone = ds.getSignedChar()
}

p[no.MSG_UPDATE] = function(data, ds) {
    data.id = ds.getLong();
    buildFields(data, ds);
}

p[no.MSG_ENTER_ROOM] = function(data, ds) {   
    data.map_name = ds.getString();
    data.room_show_name = ds.getString();
	data.map_id = ds.getLong();
    data.x = ds.getShort();
    data.y = ds.getShort();	
	data.x = data.x ^ 13107;  
    data.y = data.x ^ data.y; 
    data.map_id = data.map_id ^ ((data.x << 8) + data.y);
    data.dir = ds.getChar();
    data.map_index = ds.getLong();
    data.compact_map_index = ds.getShort();
    data.floor_index = ds.getChar();
    data.wall_index = ds.getChar();
    data.is_safe_zone = ds.getChar();
}

p[no.MSG_MOVED] = function(data, ds) {
	data.x = ds.getShort();
    data.y = ds.getShort();
    data.id = ds.getLong();
    data.dir = ds.getChar();
}

p[no.MSG_RANDOM_NAME] = function(data, ds) {
    data.new_name = ds.getString();
}

p[no.MSG_C_START_COMBAT] = function(data, ds) {
    data.flag = ds.getShort();
}

p[no.MSG_C_END_COMBAT] = function(data, ds) {
    data.flag = ds.getShort();
}

p[no.MSG_C_WAIT_COMMAND] = function(data, ds) {
    data.flag = ds.getShort();
}

p[no.MSG_L_WAIT_IN_LINE] = function(data, ds) {
    data.line_name = ds.getString();
    data.expect_time = ds.getLong();
    data.reconnet_time = ds.getLong();
    data.location = ds.getLong();
    data.count = ds.getLong();
    data.keep_alive = ds.getChar();
    data.need_wait = ds.getSignedChar();
    data.indsider_lv = ds.getSignedChar();
    data.gold_coin = ds.getLong();
    data.status = ds.getChar();
}

p[no.MSG_DIALOG_OK] = function(data, ds) {
    data.msg = ds.getString2()
    data.active = ds.getShort()
    data.mode = ds.getShort()
}

p[no.MSG_OTHER_LOGIN] = function(data, ds) {
    data.result = ds.getShort()
    data.code = ds.getShort()
    data.msg = ds.getString()
}

// 充值订单消息
p[no.MSG_CHARGE_INFO] = function(data, ds) {
    data.order_id = ds.getString()
    data.notify_url = ds.getString()
    data.product_id = ds.getString()
    data.price = ds.getLong()
}

// 通用的通知消息
p[no.MSG_GENERAL_NOTIFY] = function(data, ds) {
    data.notify = ds.getShort()
    data.para = ds.getString()
}

// 更新宠物信息
p[no.MSG_UPDATE_PETS] = function(data, ds) {
    data.count = ds.getShort();
    for (var i = 0; i < data.count; ++i) {
        var info = {};
        info.no = ds.getChar()
        info.id = ds.getLong()
        buildPetInfo(info, ds);
        data[i] = info;
    }
}

// 设置拥有者
p[no.MSG_SET_OWNER] = function(data, ds) {
    data.id = ds.getLong()
    data.owner_id = ds.getLong()
}

// 自己的摆摊信息
p[no.MSG_STALL_MINE] = function(data, ds) {
    data.dealNum = ds.getShort()
    data.sellCash = Number(ds.getString())
    data.stallTotalNum = ds.getShort()
    data.stallNum = ds.getShort()
    data.items = {}
    for (var i = 0; i < data.stallNum; ++i) {
        var item = {}
        item.name = ds.getString()
        item.id = ds.getString()
        item.price = ds.getLong()
        item.pos = ds.getShort()
        item.status = ds.getShort()
        item.startTime = ds.getLong()
        item.endTime = ds.getLong()
        item.level = ds.getShort()
        item.unidentified = ds.getChar()
        item.amount = ds.getShort()
        item.req_level = ds.getShort()
        item.simple_para = ds.getString()
        item.item_polar = ds.getChar()
        item.can_change_price_count = ds.getChar()
        item.init_price = ds.getLong()
        data.items[item.pos] = item
    }
}

// 摆摊搜索结果
p[no.MSG_MARKET_SEARCH_RESULT] = function(data, ds) {
    data.count = ds.getShort()
    data.itemList = {}

    for (var i = 0; i < data.count; ++i) {
        var item = {}
        item.name =  ds.getString()
        item.is_my_goods = ds.getChar()
        item.id = ds.getString()
        item.price = ds.getLong()
        item.state = ds.getShort()
        item.startTime = ds.getLong()
        item.endTime = ds.getLong()
        item.level = ds.getShort()
        item.unidentified = ds.getChar()
        item.amount = ds.getShort()
        item.req_level = ds.getShort()
        item.simple_para = ds.getString()
        item.item_polar = ds.getChar()
        data.itemList[i] = item;
    }
}

// 摆摊列表查询结果
p[no.MSG_STALL_ITEM_LIST] = function(data, ds) {
    data.totalPage = ds.getShort()
    data.cur_page = ds.getShort()
    data.count = ds.getShort()
    data.itemList = {}

    for (var i = 0; i < data.count; ++i) {
        var item = {}
        item.name =  ds.getString()
        item.is_my_goods = ds.getChar()
        item.id = ds.getString()
        item.price = ds.getLong()
        item.status = ds.getShort()
        item.startTime = ds.getLong()
        item.endTime = ds.getLong()
        item.level = ds.getShort()
        item.unidentified = ds.getChar()
        item.amount = ds.getShort()
        item.req_level = ds.getShort()
        item.simple_para = ds.getString()
        item.item_polar = ds.getChar()
        data.itemList[i] = item
    }
}

// 自己的金元宝信息
p[no.MSG_GOLD_STALL_MINE] = function(data, ds) {
    data.dealNum = ds.getShort()
    data.sellCash = Number(ds.getString())
    data.stallTotalNum = ds.getShort()
    data.stallNum = ds.getShort()
    data.items = {}
    for (var i = 0; i < data.stallNum; ++i) {
        var item = {}
        item.name = ds.getString()
        item.id = ds.getString()
        item.price = ds.getLong()
        item.pos = ds.getShort()
        item.status = ds.getShort()
        item.startTime = ds.getLong()
        item.endTime = ds.getLong()
        item.level = ds.getShort()
        item.unidentified = ds.getChar()
        item.req_level = ds.getShort()
        item.simple_para = ds.getString()
        item.item_polar = ds.getChar()
        item.can_change_price_count = ds.getChar()
        item.init_price = ds.getLong()
        item.flag_num = ds.getLong()
        item.type = ds.getChar()
        data.items[item.pos] = item
    }
}

// 金元宝搜索结果
p[no.MSG_GOLD_STALL_SEARCH_GOODS] = function(data, ds) {
    data.count = ds.getShort()
    data.itemList = {}

    for (var i = 0; i < data.count; ++i) {
        var item = {}
        item.name =  ds.getString()
        item.is_my_goods = ds.getChar()
        item.id = ds.getString()
        item.price = ds.getLong()
        item.state = ds.getShort()
        item.startTime = ds.getLong()
        item.endTime = ds.getLong()
        item.level = ds.getShort()
        item.unidentified = ds.getChar()
        item.req_level = ds.getShort()
        item.simple_para = ds.getString()
        item.item_polar = ds.getChar()
        data.itemList[i] = item;
    }
}

// 金元宝列表查询结果
p[no.MSG_GOLD_STALL_GOODS_LIST] = function(data, ds) {
    data.totalPage = ds.getShort()
    data.cur_page = ds.getShort()
    data.count = ds.getShort()
    data.itemList = {}

    for (var i = 0; i < data.count; ++i) {
        var item = {}
        item.name =  ds.getString()
        item.is_my_goods = ds.getChar()
        item.id = ds.getString()
        item.price = ds.getLong()
        item.status = ds.getShort()
        item.startTime = ds.getLong()
        item.endTime = ds.getLong()
        item.level = ds.getShort()
        item.unidentified = ds.getChar()
        item.req_level = ds.getShort()
        item.simple_para = ds.getString()
        item.item_polar = ds.getChar()
        data.itemList[i] = item
    }
}

// 拍卖列表查询结果
p[no.MSG_SYS_AUCTION_GOODS_LIST] = function(data, ds) {
    data.totalPage = ds.getShort()
    data.page = ds.getShort()
    data.count = ds.getShort()
    data.goodsList = {}

    for (var i = 0; i < data.count; ++i) {
        var goods = {}
        goods.gid = ds.getString()
        goods.name = ds.getString()
        goods.price = ds.getLong()
        goods.endTime = ds.getLong()
        goods.level = ds.getLong()
        goods.sortIdex = ds.getLong()
        goods.isBidder = ds.getChar()
        goods.isBided = ds.getChar()
        data.goodsList[i] = goods
    }
}

// 竞拍返回刷新商品
p[no.MSG_SYS_AUCTION_UPDATE_GOODS] = function(data, ds) {
    var goods = {}
    goods.gid = ds.getString()
    goods.name = ds.getString()
    goods.price = ds.getLong()
    goods.endTime = ds.getLong()
    goods.level = ds.getLong()
    goods.sortIdex = ds.getLong()
    goods.isBidder = ds.getChar()
    goods.isBided = ds.getChar()
}

// 物品信息
p[no.MSG_INVENTORY] = function(data, ds) {
    data.count = ds.getShort()
    for (var i = 0; i < data.count; ++i) {
        var item = {}
        item.pos = ds.getShort()
        buildItemInfo(item, ds)
        item.extra.pos = item.pos
        data[i] = item
    }
}

// 在别的线路已经登陆
p[no.MSG_ACCOUNT_IN_OTHER_SERVER] = function(data, ds) {
    data.result = ds.getChar()
    data.msg = ds.getString()
}

p[no.MSG_NOTIFY_MISC_EX] = function(data, ds) {
    data.msg = ds.getString2()
    data.time = ds.getLong()
}

p[no.MSG_CONFIRM_DLG] = function(data, ds) {
    data.tips = ds.getString()
    data.down_count = ds.getLong()
}

p[no.MSG_L_START_LOGIN] = function(data, ds) {
    data.type = ds.getString()
    data.cookie = ds.getString()
}

p[no.MSG_PLAY_SCENARIOD] = function(data, ds) {
    data.id = ds.getLong()
    data.name = ds.getString()
    data.portrait = ds.getShort()
    data.pic_no = ds.getShort()
    data.content = ds.getString2()
    data.isComplete = ds.getShort()
    data.isInCombat = ds.getChar()
    data.playTime = ds.getShort()
    data.task_type = ds.getString()
}

p[no.MSG_L_CHARGE_DATA] = function(data, ds) {
    data.order_id = ds.getString()
    data.notify_url = ds.getString()
    data.product_id = ds.getString()
    data.price = ds.getLong()
}

p[no.MSG_APPEAR] = function(data, ds) {
    data.id = ds.getLong()
    data.x = ds.getShort()
    data.y = ds.getShort()
    data.dir = ds.getShort()
    data.icon = ds.getLong()
    data.weapon_icon = ds.getLong()
    data.type = ds.getShort()
    data.sub_type = ds.getLong()
    data.owner_id = ds.getLong()
    data.leader_id = ds.getLong()
    data.name = ds.getString()
    data.level = ds.getShort()
    data.title = ds.getString()
    data.family = ds.getString()
    data.party = ds.getString()
    data.status = ds.getLong()
    data.special_icon = ds.getLong()
    data.org_icon = ds.getLong()
    data.suit_icon = ds.getLong()
    data.suit_light_effect = ds.getLong()
    data.guard_icon = ds.getLong()
    data.pet_icon = ds.getLong()
    data.shadow_icon = ds.getLong()
    data.shelter_icon = ds.getLong()
}

p[no.MSG_DISAPPEAR] = function(data, ds) {
    data.id = ds.getLong()
    data.type = ds.getShort()
}

p[no.MSG_MENU_LIST] = function(data, ds) {
    data.id = ds.getLong()
    data.portrait = ds.getLong()
    data.pic_no = ds.getShort()
    data.content = ds.getString2()
    data.secret_key = ds.getString()
    data.name = ds.getString()
    data.attrib = ds.getChar()
}

p[no.MSG_TASK_PROMPT] = function(data, ds) {
    var count = ds.getShort()
    for (var i = 0; i < count; ++i) {
        var task = {}
        task.task_type = ds.getString()
        task.task_desc = ds.getString2()
        task.task_prompt = ds.getString2()
        task.refresh = ds.getShort()
        task.task_end_time = ds.getLong()
        task.attrib = ds.getShort()
        task.reward = ds.getString2()
        task.show_name = ds.getString()

        if ("" == task.show_name)
            task.show_name = task.task_type;

        task.task_extra_para = ds.getString()
        task.task_state = ds.getString()

        data[task.task_type] = task
    }
}

p[no.MSG_PLAY_INSTRUCTION] = function(data, ds) {
    data.guideId = ds.getShort()
}

p[no.MSG_GOODS_LIST] = function(data, ds) {
    data.shipper = ds.getLong()
    data.shopType = ds.getShort()   // 0为药店   1为杂货店
    data.pk_add = ds.getShort()
    data.discount = ds.getShort()
    data.server_type = ds.getShort()
    data.count = ds.getShort()

    var goods = {}
    for (i = 0; i < data.count; ++i) {
        var goods_no = ds.getShort()
        var pay_type = ds.getLong()
        var itemCount = ds.getShort()
        var name = ds.getString()
        var value = ds.getLong()
        var level = ds.getShort()
        var type = ds.getChar()  // 商品分类，未分类时为 0

        goods[name] = {goods_no : goods_no, pay_type : pay_type, name : name, value : value, level : level, type : type};
    }

    data.goods  = goods;
    data.tax    = ds.getShort()
}

p[no.MSG_OPEN_EXCHANGE_SHOP] = function(data, ds) {
    data.type = ds.getChar()
    data.count = ds.getShort()
    data.items = {}
    for (i = 0; i < data.count; ++i) {
        var item = {}
        item.name = ds.getString()
        item.price = ds.getLong()
        item.payName = ds.getString()

        data.items[item.name] = item;
    }
}

p[no.MSG_SUBMIT_PET] = function(data, ds) {
    data.type = ds.getShort()
    data.petName = ds.getString()
    data.petState = ds.getLong()
}

p[no.MSG_INSIDER_INFO] = function(data, ds) {
    data.vipType = ds.getChar()
    ds.getLong()
    ds.getLong()
    ds.getChar()
    ds.getChar()
}

p[no.MSG_UPDATE_TEAM_LIST] = function(data, ds) {
    var count = ds.getShort()
    var members = {}
    for (var i = 0; i < count; ++i) {
        var member = {}
        member.id = ds.getLong()
        member.gid = ds.getString()
        member.suit_icon = ds.getLong()
        member.weapon_icon = ds.getShort()
        member.org_icon = ds.getShort()
        buildFields(member, ds);
        member.card_name = ds.getString()
        member.card_end_time = ds.getLong()
        member.light_effect_count = ds.getChar()
        member.light_effect = {}
        for (var j = 0; j < member.light_effect_count; ++j) {
            ds.getLong()
        }
        member.suit_light_effect = ds.getLong()
        member.recent_raise_bad = ds.getLong()
        member.index = i;
        members[member.id] = member
    }

    data.members = members
}

p[no.MSG_MATCH_TEAM_STATE] = function(data, ds) {
    data.state = ds.getSignedChar()
    if (0 != data.state) {
        data.type = ds.getChar()
    }
}

p[no.MSG_TEAM_MOVED] = function(data, ds) {
    data.id = ds.getLong()
    data.x = ds.getShort()
    data.y = ds.getShort()
    data.map_id = ds.getLong()
}

p[no.MSG_MESSAGE_EX] = function(data, ds) {
    data.channel = ds.getShort()
    data.id = ds.getLong()
    data.name = ds.getString()
    data.msg = ds.getString2()
    data.time = ds.getLong()
    data.privilege = ds.getShort()
    data.server_name = ds.getString()
    data.show_extra = ds.getShort()
    data.compress = ds.getShort()
    data.orgLength = ds.getShort()

    // todo : 其它数据不关心
}

p[no.MSG_PARTY_LIST_EX] = function(data, ds) {
    data.type   = ds.getString()
    data.count  = ds.getShort()
    data.partiesInfo = {}

    for (var i = 0; i < data.count; ++i) {
        var party = {}
        party.partyId = ds.getString()           // 帮派ID
        party.partyName = ds.getString()         // 帮派名称
        party.partyLevel = ds.getShort()
        party.population = ds.getShort()
        party.construct = ds.getLong()

        data.partiesInfo[i] = party;
    }
}

p[no.MSG_SYNC_MESSAGE] = function(data, ds) {
    var dataLen = ds.getDataLen()
    var msgLen  = ds.getShort()
    if (dataLen != msgLen) {
        // 消息格式不正确
        console.log("Invalid MSG_SYNC_MESSAGE");
        return;
    }

    data.sync_msg = ds.getShort()

    var msgStr = no[data.sync_msg]
    if ('MSG_TASK_PROMPT' != msgStr) {
        // 不需要处理
        return;
    }

    var func = p[data.sync_msg]
    if (! func) {
        // 没有解析函数
        return;
    }

    func(data, ds)
}

p[no.MSG_REQUEST_SERVER_STATUS] = function(data, ds) {
    data.count = ds.getShort()
    data.list  = {}
    data.size  = 0;

    for (var i = 0; i < data.count; ++i) {
        ds.getShort();
        var name = ds.getString();
        ds.getString();
        var status = ds.getShort();

        if (status <= 4) {
            data.list[data.size] = name;
            ++data.size;
        }
    }
}

p[no.MSG_NOTIFY_SECURITY_CODE] = function(data, ds) {
    data.choices        = [ ds.getLong(), ds.getLong(), ds.getLong(), ds.getLong() ];
    data.answer         = ds.getString()
    data.finishTime     = ds.getLong()
    data.triggerTime    = ds.getLong()
}
p[no.MSG_MAILBOX_REFRESH] = function(data, ds) {
    let count = ds.getShort();
    for (var i = 0; i < count; ++i) {
        var info = {}
        info.id = ds.getString()
        info.type =ds.getShort()
        info.sender = ds.getString()
        info.title = ds.getString()
        info.msg =ds.getString2()
        info.attachment = ds.getString2()
        info.create_time = ds.getLong()
        info.expired_time = ds.getLong()
        info.status = ds.getShort();
        data[i] = info;
    }
}

// p[no.MSG_REPLY_ECHO] = function(data, ds) {
//     data.peer_time = ds.getLong();
// }

module.exports = {
    parser : p
};
