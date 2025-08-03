// GeneralNotify.js
// created by yuhx Jan/06/2016
// 通用系统类型定义

var gen_no = {
    NOTIFY_CALL_GUARD                   : 6,        // 召唤守护
    NOTIFY_START_AUTO_FIGHT             : 37,       // 开启自动战斗
    NOTIFY_OPEN_CONFIRM_DLG             : 40,       // 弹出确认框
    NOTIFY_STALL_ITEM_PRICE             : 45,       // 摆摊物品价格
    NOTIFY_OPEN_DLG                     : 97,       // 打开界面
    NOTIFY_FAST_ADD_EXTRA               : 10007,    // 快速添加生命、法力、忠诚储备
    NOTICE_OVER_INSTRUCTION             : 20004,    // 结束指引
    NOTIFY_FETCH_BONUS                  : 20005,    // 领取奖励
    NOTIFY_OPEN_EXORCISM                : 20008,    // 开启驱魔香
    NOTIFY_CLOSE_EXORCISM               : 20009,    // 关闭驱魔香

    NOTIFY_SUBMIT_PET                   : 30020,    // 提交宠物操作

    NOTIFY_FETCH_NEWBIE_GIFT            : 40013,    // 领取新手礼包
    NOTIFY_OPEN_MY_STALL                : 40015,    // 打开我的集市
    NOTIFY_STALL_REMOVE_GOODS           : 40016,    // 集市下架物品
    NOTIFY_OPEN_STALL_LIST              : 40018,    // 集市打开交易列表
    NOTIFY_STALL_QUERY_PRICE            : 40021,    // 查询物品价格
    NOTIFY_STALL_TAKE_CASH              : 40022,    // 取钱
    NOTIFY_CANCEL_MATCH_MEMBER          : 40025,    // 取消队员的匹配
    NOTIFY_START_MATCH_MEMBER           : 40026,    // 开始队员匹配
    NOTIFY_BUY_INSIDER                  : 50006,    //购买会员
    NOTIFY_TEAM_ASK_REFUSE              : 30031,    //投票拒绝
    NOTIFY_TEAM_ASK_AGREE               : 30030,    //投票同意
};

for (var k in gen_no) {
    gen_no[gen_no[k]] = k;
}

module.exports = gen_no;
