// CmdMsg.js
// created by cheny Jul/14/2015
// 消息编号

var no = {
    CMD_ECHO							: 0x10B2,
    CMD_L_GET_ANTIBOT_QUESTION			: 0x0B05,
    CMD_L_CHECK_USER_DATA				: 0x1B03,
    CMD_L_ACCOUNT						: 0x2350,
    CMD_L_GET_SERVER_LIST				: 0x3354,
    CMD_L_CLIENT_CONNECT_AGENT			: 0x3356,
    CMD_LOGIN							: 0x3002,
    CMD_LOGOUT							: 0x0004,
    CMD_LOAD_EXISTED_CHAR				: 0x1060,
    CMD_CHAT_EX							: 0x4062,
    CMD_SELECT_MENU_ITEM				: 0x3038,
    CMD_MULTI_MOVE_TO					: 0xF0C2,
    CMD_OTHER_MOVE_TO                   : 0x40AE,
    CMD_ENTER_ROOM                      : 0x1030,
    CMD_GENERAL_NOTIFY                  : 0xF908,
    CMD_SWITCH_SERVER                   : 0x10D4,

    // Combat command from client to server
    CMD_C_DO_ACTION						: 0x3202,
    CMD_C_END_ANIMATE					: 0x2204,
    CMD_C_FLEE							: 0x0206,
    CMD_C_CATCH_PET						: 0x1208,
    CMD_C_SELECT_MENU_ITEM				: 0x220A,
    CMD_C_SET_POS						: 0x120C,

    CMD_REQUEST_ITEM_INFO               : 0x10CD,
    CMD_CHANGE_TITLE                    : 0x10C0,
    CMD_OPEN_MENU                       : 0x1036,
    CMD_QUIT_TEAM                       : 0x001A,
    CMD_KICKOUT                         : 0x1018,
    CMD_RETURN_TEAM                     : 0x001C,
    CMD_LEAVE_TEMP_TEAM                 : 0x1020,
    CMD_ACCEPT                          : 0x1024,
    CMD_REJECT                          : 0x1026,
    CMD_EQUIP                           : 0x1028,
    CMD_REQUEST_JOIN                    : 0x103C,
    CMD_CHANGE_TEAM_LEADER              : 0x001E,
    CMD_C_SELECT_MENU_ITEM              : 0x220A,
    CMD_OPER_TELEPORT_ITEM              : 0x40CE,
    CMD_ASSIGN_ATTRIB                   : 0x203E,
    CMD_PRE_ASSIGN_ATTRIB               : 0x3802,
    CMD_SET_RECOMMEND_ATTRIB            : 0x2294,
    CMD_SELECT_VISIBLE_PET              : 0x1084,
    CMD_SELECT_CURRENT_PET              : 0x1042,
    CMD_DROP_PET                        : 0x1086,
    CMD_SET_PET_NAME                    : 0x2050,
    CMD_LEARN_SKILL                     : 0x2074,
    CMD_APPLY                           : 0x202C,
    CMD_FEED_PET                        : 0x204E,
    CMD_SORT_PACK                       : 0x2036,
    CMD_GUARDS_CHANGE_NAME              : 0x10F5,
    CMD_GUARDS_CHEER                    : 0x10FB,
    CMD_CREATE_NEW_CHAR                 : 0x205C,
    CMD_KILL                            : 0x1012,
    CMD_CLOSE_MENU                      : 0x003A,
    CMD_REFRESH_SERVICE_LOG             : 0x10DC,
    CMD_REFRESH_TASK_LOG                : 0x1070,
    CMD_GET                             : 0x104A,
    CMD_MOVE_ON_CARPET                  : 0x10F0,
    CMD_GATHER_UP                       : 0xA014,

    // 好友相关
    CMD_ADD_FRIEND                      : 0x2066,
    CMD_REMOVE_FRIEND                   : 0x2068,
    CMD_REFRESH_FRIEND                  : 0x206A,
    CMD_FINGER                          : 0x1072,

    CMD_FRIEND_TELL_EX                  : 0x506E,

    // from 0x8000
    CMD_TELEPORT                        : 0x8000,
    CMD_SET_RECOMMEND_POLAR             : 0x8002,
    CMD_SET_SHAPE_TEMP                  : 0x8004,
    CMD_PRE_UPGRADE_EQUIP               : 0x8006,
    CMD_UPGRADE_EQUIP                   : 0x8008,
    CMD_BATCH_BUY                       : 0x800A,
    CMD_CREATE_PARTY                    : 0x800C,
    CMD_QUERY_PARTYS                    : 0x800E,
    CMD_PARTY_REJECT_LEVEL              : 0x8010,
    CMD_PARTY_GET_BONUS                 : 0x8012,
    CMD_REFRESH_PARTY_SHOP              : 0x8016,
    CMD_BUY_FROM_PARTY_SHOP             : 0x8018,
    CMD_SHIMEN_TASK_DONATE              : 0x8022,      // 师门任务捐助
    CMD_AUTO_FIGHT_SET_DATA             : 0x80D8,      // 设置自动战斗数据
    CMD_CONSOLE_PASS_TASK_STATE         : 0x8248,      // 压测机器人跳过任务步骤
    CMD_REQUEST_SERVER_STATUS           : 0x00DE,
    CMD_ANSWER_SECURITY_CODE            : 0xD040,

    // from 0x9000
    CMD_FEED_GUARD                      : 0x9002,
    CMD_FRIEND_VERIFY_RESULT            : 0x9004,
    CMD_ADMIN_TEST_SKILL                : 0x9A00,

    // from 0xA000
    CMD_MAILBOX_OPERATE                 : 0xA000,

    // from 0xB000
    CMD_OPER_SCENARIOD                  : 0xB001,

    // 帮派
    CMD_PARTY_INFO                      : 0x00B2,
    CMD_PARTY_MEMBERS                   : 0x20B8,
    CMD_PARTY_MODIFY_MEMBER             : 0x40BA,
    CMD_PARTY_REQUEST_LIST              : 0x10B0,
    CMD_DEVELOP_SKILL                   : 0x20B0,
    CMD_CONTROL_PARTY_CHANNEL           : 0x2E3A,
    CMD_GET_PARTY_CHANNEL_DENY_LIST     : 0x2E3C,
    CMD_GET_PARTY_LOG                   : 0x21A0,
    CMD_SET_LEADER_DECLARATION          : 0x8014,
    CMD_PARTY_SEND_MESSAGE              : 0x10F6,
    CMD_SET_PARTY_QUANQL                : 0xD000,
    CMD_PARTY_MODIFY_ANNOUNCE           : 0x10B6,

    // 变异宠物商店
    CMD_BUY_FROM_ELITE_PET_SHOP         : 0xD004,
    // 在线商城
    CMD_OPEN_ONLINE_MALL                : 0x00D8,
    CMD_BUY_FROM_ONLINE_MALL            : 0x20DA,

    // 帮战报名
    CMD_BID_PARTY_WAR                   : 0xD006,
    CMD_ADD_PARTY_WAR_MONEY             : 0xD008,
    CMD_REFRESH_PARTY_WAR_BID           : 0xD00A,
    CMD_VIEW_PARTY_WAR_HISTORY          : 0x10F2,

    // 神秘大礼抽奖
    CMD_START_AWARD                     : 0xC002,

    // 炼丹
    CMD_MAKE_PILL                       : 0x70A8,

    // 集市相关
    CMD_SET_STALL_GOODS                 : 0x40C6,
    CMD_BUY_FROM_STALL                  : 0x30CA,
    CMD_START_MATCH_TEAM_LEADER         : 0xC006,
    CMD_MARKET_SEARCH_ITEM              : 0xB028,

    // 拍卖相关
    CMD_SYS_AUCTION_GOODS_LIST          : 0x8024,   // 请求系统拍卖数据
    MSG_SYS_AUCTION_GOODS_LIST          : 0x8025,   // 通知系统拍卖数据
    CMD_SYS_AUCTION_BID_GOODS           : 0x8026,   // 系统拍卖竞价
    MSG_SYS_AUCTION_UPDATE_GOODS        : 0x8027,   // 更新单个商品数据
    CMD_GOLD_STALL_OPEN_MY              : 0x8100,   // 打开自己的金元宝交易界面
    MSG_GOLD_STALL_MINE                 : 0x8101,   // 通知自己的金元宝交易数据
    CMD_GOLD_STALL_OPEN                 : 0x8102,   // 请求金元宝交易逛摊
    MSG_GOLD_STALL_GOODS_LIST           : 0x8103,   // 通知金元宝交易逛摊数据
    CMD_GOLD_STALL_PUT_GOODS            : 0x8104,   // 金元宝交易上架
    MSG_GOLD_STALL_UPDATE_GOODS_INFO    : 0x8105,   // 通知更新单个商品数据
    CMD_GOLD_STALL_RESTART_GOODS        : 0x8106,   // 金元宝交易重新上架
    CMD_GOLD_STALL_REMOVE_GOODS         : 0x8108,   // 金元宝交易下架商品
    CMD_GOLD_STALL_BUY_GOODS            : 0x810A,   // 金元宝交易购买商品
    CMD_GOLD_STALL_RECORD               : 0x810B,   // 金元宝交易查看交易记录
    MSG_GOLD_STALL_RECORD               : 0x810C,   // MSG_STALL_RECORD
    CMD_GOLD_STALL_TAKE_CASH            : 0x810D,   // 金元宝交易提取金元宝
    CMD_GOLD_STALL_GOODS_STATE          : 0x810E,   // 金元宝交易请求商品状态
    MSG_GOLD_STALL_GOODS_STATE          : 0x810F,   // 金元宝交易通知商品状态
    CMD_GOLD_STALL_SEARCH_GOODS         : 0x8110,   // 金元宝交易请求搜索
    MSG_GOLD_STALL_SEARCH_GOODS         : 0x8111,   // 金元宝交易通知搜索结果
    CMD_GOLD_STALL_GOODS_INFO           : 0x8112,   // 金元宝交易请求商品名片
    MSG_GOLD_STALL_GOODS_INFO_PET       : 0x8113,   // 金元宝交易请求宠物名片
    MSG_GOLD_STALL_GOODS_INFO_ITEM      : 0x8115,   // 金元宝交易请求道具名片

    CMD_TRADING_SELL_ROLE               : 0x8052,   // 在游戏中出售角色
    MSG_TRADING_ROLE                    : 0x8053,   // 通知客户端玩家的寄售信息
    CMD_TRADING_CANCEL_ROLE             : 0x8054,   // 客户端请求取回角色
    MSG_OPEN_URL                        : 0x8055,   // 通知客户端打开url
    CMD_TRADING_CHANGE_PRICE_ROLE       : 0x8056,   // 客户端请求修改角色价格
    CMD_TRADING_SELL_ROLE_AGAIN         : 0x8058,   // 客户端请求继续寄售角色
    CMD_TRADING_SNAPSHOT                : 0x805A,   // 客户端请求商品的快照信息
    MSG_TRADING_SNAPSHOT                : 0x805B,   // 通知客户端商品的快照信息

    // 系统设置
    CMD_SET_SETTING                     : 0x2094,

    // 药店
    CMD_GOODS_BUY                       : 0x3044,

    CMD_RANDOM_NAME                     : 0xB011,

    // 天技秘笈商店
    CMD_EXCHANGE_GOODS                  : 0xA006,
    CMD_L_REQUEST_LINE_INFO             : 0xB058,

    CMD_CONFIRM_RESULT          : 0x5100,
    CMD_L_START_RECHARGE        : 0xB235,
    CMD_L_CHARGE_LIST           : 0xB238,
    CMD_L_START_BUY_INSIDER     : 0xB23A,

    MSG_CLIENT_CONNECTED        : 0x1366,
    MSG_CLIENT_DISCONNECTED     : 0x1368,
    MSG_REPLY_ECHO              : 0x10B3,
    MSG_L_ANTIBOT_QUESTION      : 0x1B06,
    MSG_L_CHECK_USER_DATA       : 0x2B04,
    MSG_L_AUTH                  : 0x5351,
    MSG_L_SERVER_LIST           : 0x4355,
    MSG_L_AGENT_RESULT          : 0x3357,
    MSG_ANSWER_FIELDS           : 0xF00D,
    MSG_EXISTED_CHAR_LIST       : 0xF061,
    MSG_SWITCH_SERVER           : 0x20D5,
    MSG_SWITCH_SERVER_EX        : 0x20D6,
    MSG_SPECIAL_SWITCH_SERVER_EX : 0xB0EA,
    MSG_ENTER_GAME              : 0x10E1,
    MSG_MENU_LIST               : 0x2037,
    MSG_MESSAGE                 : 0x2FFF,
    MSG_MESSAGE_EX              : 0x3FFF,
    MSG_TITLE                   : 0xF0E7,
    MSG_RELOCATE                : 0xF0DB,
    MSG_MENU_CLOSED             : 0x103B,
    MSG_UPDATE_IMPROVEMENT      : 0xFFE7,
    MSG_EXECUTE_LUA_CODE                    : 0xD165,
    MSG_INVENTORY               : 0xFFF5,
    MSG_UPDATE_SKILLS           : 0x7FEB,
    MSG_UPDATE                  : 0xFFF7,
    MSG_UPDATE_APPEARANCE       : 0xF0DD,
    MSG_ENTER_ROOM              : 0xFFE1,
    MSG_DIALOG_OK               : 0x1FE5,
    MSG_MOVED                   : 0x402F,
    MSG_APPEAR                  : 0xFFF9,
    MSG_DISAPPEAR               : 0x2FFD,
    MSG_GODBOOK_EFFECT_SUMMON   : 0x2EFB,
    MSG_GODBOOK_EFFECT_NORMAL   : 0x2EF9,
    MSG_EXITS                   : 0xFFFB,
    MSG_UPDATE_PETS             : 0xFFE3,
    MSG_SET_VISIBLE_PET         : 0x1065,
    MSG_SET_CURRENT_PET         : 0x1043,
    MSG_SET_OWNER               : 0x2FED,
    MSG_GUARDS_REFRESH          : 0x2EF0,
    MSG_SET_CURRENT_MOUNT       : 0x20E9,
    MSG_APPELLATION_LIST        : 0xF301,
    MSG_TASK_PROMPT             : 0xF071,
    MSG_UPDATE_TEAM_LIST        : 0x1017,
    MSG_UPDATE_TEAM_LIST_EX     : 0x1019,
    MSG_DIALOG                  : 0x4FF3,
    MSG_CLEAN_REQUEST           : 0xF097,
    MSG_SERVICE_LOG             : 0x3FBD,
    MSG_TELEPORT_EX             : 0xFD0A,
    MSG_TOP_USER                : 0xF0D5,
    MSG_PRE_ASSIGN_ATTRIB       : 0x3801,
    MSG_TEAM_MOVED              : 0x402D,
    MSG_SEND_RECOMMEND_ATTRIB   : 0x2295,
    MSG_REFRESH_PET_GODBOOK_SKILLS: 0x2EF7,
    MSG_FINISH_SORT_PACK        : 0x2039,
    MSG_C_ACCEPTED_COMMAND      : 0x0203,
    MSG_C_FLEE                  : 0x2207,
    MSG_C_CATCH_PET             : 0x3209,
    MSG_C_START_COMBAT          : 0x0DFF,
    MSG_C_END_COMBAT            : 0x0DFD,
    MSG_C_FRIENDS               : 0xFDFB,
    MSG_C_OPPONENTS             : 0xFDF9,
    MSG_C_DIRECT_OPPONENT_INFO  : 0x2DD1,
    MSG_C_ACTION                : 0x4DF7,
    MSG_C_CHAR_DIED             : 0x1DF5,
    MSG_C_CHAR_REVIVE           : 0x1DF3,
    MSG_C_LIFE_DELTA            : 0x3DF1,
    MSG_C_MANA_DELTA            : 0x3DEF,
    MSG_C_UPDATE_STATUS         : 0x2DED,
    MSG_C_WAIT_COMMAND          : 0x1DEB,
    MSG_C_ACCEPT_HIT            : 0x4DE9,
    MSG_C_END_ACTION            : 0x1DE7,
    MSG_C_QUIT_COMBAT           : 0x1DE5,
    MSG_C_ADD_FRIEND            : 0xFDE3,
    MSG_C_ADD_OPPONENT          : 0xFDE1,
    MSG_C_UPDATE_IMPROVEMENT    : 0xFDDF,
    MSG_C_UPDATE_APPEARANCE     : 0xF0FF,
    MSG_C_ACCEPT_MAGIC_HIT      : 0xFDDD,
    MSG_C_LEAVE_AT_ONCE         : 0x1DDB,
    MSG_C_MESSAGE               : 0x3DD9,
    MSG_C_DIALOG_OK             : 0x1DD7,
    MSG_C_UPDATE                : 0xFDD5,
    MSG_C_COMMAND_ACCEPTED      : 0x2DD3,
    MSG_SYNC_MESSAGE            : 0xFDD1,
    MSG_C_MENU_LIST             : 0x3DCF,
    MSG_C_MENU_SELECTED         : 0x2DCD,
    MSG_C_REFRESH_PET_LIST      : 0xFDCB,
    MSG_C_DELAY                 : 0x2DC9,
    MSG_C_LIGHT_EFFECT          : 0x2DC7,
    MSG_C_WAIT_ALL_END          : 0x0DC5,
    MSG_C_START_SEQUENCE        : 0x2DC3,
    MSG_C_SANDGLASS             : 0x2DC1,
    MSG_C_CHAR_OFFLINE          : 0x2DBF,
    MSG_C_ACCEPT_MULTI_HIT      : 0x4DEB,
    MSG_C_OPPONENT_INFO         : 0xFDBD,
    MSG_C_BATTLE_ARRAY          : 0xFDBB,
    MSG_C_SET_FIGHT_PET         : 0xFDB1,
    MSG_C_SET_CUSTOM_MSG        : 0xFDB3,
    MSG_PICTURE_DIALOG          : 0xF0D9,
    MSG_ATTACH_SKILL_LIGHT_EFFECT: 0x2EFC,
    MSG_GENERAL_NOTIFY          : 0x23A9,
    MSG_GOODS_LIST              : 0xFFDF,
    MSG_ITEM_APPEAR             : 0xFFF1,
    MSG_ITEM_DISAPPEAR          : 0x20E5,
    MSG_LC_START_LOOKON         : 0x09FF,
    MSG_LC_END_LOOKON           : 0x09FD,
    MSG_LC_FRIENDS              : 0xF9FB,
    MSG_LC_OPPONENTS            : 0xF9F9,
    MSG_LC_ACTION               : 0x49F7,
    MSG_LC_CHAR_DIED            : 0x29F5,
    MSG_LC_CHAR_REVIVE          : 0x19F3,
    MSG_LC_LIFE_DELTA           : 0x39F1,
    MSG_LC_MANA_DELTA           : 0x39EF,
    MSG_LC_UPDATE_STATUS        : 0x29ED,
    MSG_LC_WAIT_COMMAND         : 0x19EB,
    MSG_LC_ACCEPT_HIT           : 0x39E9,
    MSG_LC_END_ACTION           : 0x19E7,
    MSG_LC_FLEE                 : 0x29E5,
    MSG_LC_CATCH_PET            : 0x39E3,
    MSG_LC_INIT_STATUS          : 0xF9E1,
    MSG_LC_QUIT_COMBAT          : 0x19DF,
    MSG_LC_UPDATE_IMPROVEMENT   : 0xF9DD,
    MSG_LC_ACCEPT_MAGIC_HIT     : 0xF9DB,
    MSG_LC_LEAVE_AT_ONCE        : 0x19D9,
    MSG_LC_ADD_FRIEND           : 0xF9D7,
    MSG_LC_ADD_OPPONENT         : 0xF9D5,
    MSG_LC_UPDATE               : 0xF9D3,
    MSG_LC_MENU_LIST            : 0x39D1,
    MSG_LC_MENU_SELECTED        : 0x2DCF,
    MSG_LC_DELAY                : 0x29CD,
    MSG_LC_LIGHT_EFFECT         : 0x29CB,
    MSG_LC_WAIT_ALL_END         : 0x09C9,
    MSG_LC_SANDGLASS            : 0x29C7,
    MSG_LC_CHAR_OFFLINE         : 0x2DC5,
    MSG_LC_START_SEQUENCE       : 0x29C3,
    MSG_SEND_RECOMMEND_POLAR    : 0x8003,
    MSG_PRE_UPGRADE_EQUIP       : 0x8007,
    MSG_UPGRADE_EQUIP_COST      : 0x8005,
    MSG_IDENTIFY_INFO           : 0x8009,
    MSG_REFRESH_PARTY_SHOP      : 0x8017,
    MSG_GUARD_UPDATE_EQUIP      : 0x9001,
    MSG_GUARD_UPDATE_GROW_ATTRIB: 0x9003,
    MSG_RECOMMEND_FRIEND        : 0x9005,
    MSG_CHAR_INFO               : 0x9007,
    MSG_PET_CARD                : 0x9017,
    MSG_MAILBOX_REFRESH         : 0xA001,
    MSG_PLAY_SCENARIOD          : 0xB000,
    MSG_PARTY_INFO              : 0xF0A1,
    MSG_PARTY_MEMBERS           : 0xF0A3,
    MSG_PARTY_QUERY_MEMBER      : 0xF0A5,
    MSG_REQUEST_ECARD_INFO      : 0x0FB7,
    MSG_PARTY_LIST              : 0xF0B3,
    MSG_PARTY_CHANNEL_DENY_LIST : 0x2E39,
    MSG_SEND_PARTY_LOG          : 0x2333,
    MSG_OPEN_ELITE_PET_SHOP     : 0xD001,
    MSG_ICON_CARTOON            : 0xA004,
    MSG_DUNGEON_LIST            : 0xB002,
    MSG_DUNGEON_GET_BONUS       : 0xB003,
    MSG_TONGTIANTA_INFO         : 0xC003,
    MSG_TONGTIANTA_BONUS_DLG    : 0xC005,
    MSG_SHUADAO_REFRESH         : 0xB004,
    MSG_SHUADAO_REFRESH_BONUS   : 0xB005,
    MSG_SHUADAO_REFRESH_BUY_TIME: 0xB006,
    MSG_FRIEND_GROUP_OPERATION  : 0x3065,
    MSG_FRIEND_UPDATE_LISTS     : 0xF067,
    MSG_FRIEND_ADD_CHAR         : 0xF069,
    MSG_FRIEND_REMOVE_CHAR      : 0x306B,
    MSG_FRIEND_NOTIFICATION     : 0x206D,
    MSG_FRIEND_UPDATE_PARTIAL   : 0x5FB9,
    MSG_FINGER                  : 0xF073,
    MSG_ONLINE_MALL_LIST        : 0xFFDB,
    MSG_AUTO_PRACTICE_BONUS     : 0x9009,
    MSG_ARENA_INFO              : 0x900B,
    MSG_ARENA_OPPONENT_LIST     : 0x900D,
    MSG_ARENA_TOP_BONUS_LIST    : 0x900F,
    MSG_ARENA_SHOP_ITEM_LIST    : 0x9011,
    MSG_CHALLENGE_MSG           : 0x9015,
    MSG_LIVENESS_INFO           : 0x9013,
    MSG_AUTO_WALK               : 0xB007,
    MSG_LOOK_PLAYER_EQUIP       : 0xC001,
    MSG_CARD_INFO               : 0xA002,
    MSG_PARTY_WAR_BID_INFO      : 0xD003,
    MSG_PARTY_WAR_INFO          : 0xF101,
    MSG_PARTY_WAR_SCORE         : 0xD005,
    MSG_NEWBIE_GIFT             : 0xC013,
    MSG_DAILY_SIGN              : 0xC011,
    MSG_AWARD_OPEN              : 0xC00D,
    MSG_AWARD_INFO_EX           : 0xC009,
    MSG_FINISH_AWARD            : 0xC00B,
    MSG_OPEN_WELFARE            : 0xC007,
    MSG_SHIDAO_TASK_INFO        : 0xC019,
    MSG_SHIDAO_GLORY_HISTORY    : 0xC017,
    MSG_PLAY_INSTRUCTION        : 0xA005,
    MSG_STALL_MINE              : 0xC01B,
    MSG_REFRESH_STALL_ITEM      : 0xC01D,
    MSG_STALL_ITEM_LIST         : 0xC01F,
    MSG_STALL_RECORD            : 0xC021,
    MSG_STALL_SERACH_ITEM_LIST  : 0xC023,
    MSG_MARKET_SEARCH_RESULT    : 0xB029,
    MSG_PLAY_LIGHT_EFFECT       : 0x2FD3,
    MSG_STOP_LIGHT_EFFECT       : 0xA009,

    MSG_MATCH_TEAM_STATE        : 0xC025,
    MSG_MATCH_TEAM_LIST         : 0xC027,
    MSG_MATCH_SIZE              : 0xB013,

    MSG_CITY_WAR_SCORE          : 0xD007,
    MSG_LEVEL_UP                : 0x10E3,

    MSG_NOTIFICATION            : 0x1013,

    MSG_INSIDER_INFO            : 0xD009,

    MSG_SET_SETTING             : 0xF095,

    MSG_MENU_SELECT             : 0xB008,
    MSG_FIND_CHAR_MENU_FAIL     : 0xB009,
    MSG_RANDOM_NAME             : 0xB010,
    MSG_LEADER_COMBAT_GUARD     : 0xB012,
    MSG_OPEN_EXCHANGE_SHOP      : 0xA007,
    MSG_FIGHT_CMD_INFO          : 0x9019,

    MSG_GUARD_CARD              : 0xB016,

    MSG_EQUIP_CARD              : 0xB017,
    MSG_COMBAT_STATUS_INFO      : 0xA008,
    MSG_PARTY_LIST_EX           : 0xA011,

    MSG_RANK_CLIENT_INFO        : 0xB015,

    MSG_ASSURE_CONTINUE         : 0xB014,

    MSG_OPEN_AUTO_MATCH_TEAM    : 0xB019,

    MSG_SUBMIT_PET              : 0xB018,
    MSG_L_WAIT_IN_LINE          : 0xB057,
    MSG_OTHER_LOGIN             : 0xB054,
    MSG_CHARGE_INFO             : 0xB059,
    MSG_ACCOUNT_IN_OTHER_SERVER : 0xB046,

    MSG_CONFIRM_DLG             : 0xB0B8,

    MSG_NOTIFY_MISC_EX          : 0x5001,
    MSG_L_START_LOGIN           : 0xB1F3,
    MSG_L_CHARGE_DATA           : 0xB236,
    MSG_MESSAGE_EX              : 0x3FFF,
    MSG_REQUEST_SERVER_STATUS   : 0xF0DF,
    MSG_NOTIFY_SECURITY_CODE    : 0xD03D,

    MSG_BUY_SHUADAO_RUYI_POINT  : 0xB106,
    CMD_SET_SHUADAO_RUYI_STATE  : 0xB105,//如意刷道令状态
    CMD_NEW_LOTTERY_DRAW        : 0xB149,//抽奖
    CMD_SEVENDAY_GIFT_FETCH     : 0xB16F,//签到
    CMD_SELECT_CURRENT_MOUNT    : 0x111E,
};

for (var k in no) {
    no[no[k]] = k;
}

module.exports = no;
