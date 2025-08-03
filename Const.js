module.exports = {
    TRADING_STATE : {
        SHOW            : 10,     // 公示
        SALE            : 20,     // 寄售
        PAUSE           : 30,     // 暂停寄售，游戏内不管
        PAYMENT         : 40,     // 付款，游戏内不管
        CLOSED          : 50,     // 交易成功
        CANCEL          : 60,     //  取消寄售     此状态下可以重新寄售
        TIMEOUT         : 70,     // 过期         此状态下可以重新寄售
        FETCHED         : 80,     // 商品取回
        FROZEN          : 90,     // 客服冻结
        GOT             : 100,    // 购买商品后买家得到了
        FORCE_CLOSED    : 110,    // 强制下架
        ERROR           : 120,    // 错误状态
    },

    CONNECT_TYPE : {
        NORMAL      : 1,    // 游戏正常连接
        LINE_UP     : 2,    // 排队时充值、购买会员使用的连接
    },

    ACCOUNT_TYPE : {
        NORMAL  : "normal",  // 正常登陆
        CHARGE  : "charge",  // 充值登陆
        INSIDER : "insider", // 购买会员登陆
    },

    PANE_HEIGHT : 24,
    PANE_WIDTH : 24,
    MAP_SCALE : 1,

    TASK_STATE  : {
        S0      : '0',
        S1      : '1',
        S2      : '2',
        S3      : '3',
        S4      : '4',
        S5      : '5',
        S6      : '6',
        S7      : '7',
        S8      : '8',
        S9      : '9',
        S10     : '10',
        S11     : '11',
        S12     : '12',
        S13     : '13',
        S14     : '14',
        S15     : '15',
        S16     : '16',
        S17     : '17',
        S18     : '18',
        S19     : '19',
        S20     : '20',
        S21     : '21',
        S22     : '22',
        S23     : '23',
        S24     : '24',
        S25     : '25',
        S26     : '26',
        S27     : '27',
        S28     : '28',
        S29     : '29',
        S30     : '30',
        S31     : '31',
        S32     : '32',
        S33     : '33',
        S34     : '34',
        S35     : '35',
        S36     : '36',
        S37     : '37',
        S38     : '38',
        S39     : '39',
    },

    TASK_NAME   : {
        ZX_FSRM : '主线—浮生若梦',
        ZX_BRSM : '主线—拜入师门',
        ZX_SYYL : '主线—山雨欲来',
        ZX_TJNC : '主线—天机难测',
        ZX_DXWX : '主线—道心我心',

        CHUBAO      : '为民除暴',
        XIANGYAO    : '降妖',
        LAOJUN_FANU : '老君发怒',

        SHIMEN      : '师门任务',
        SHIMEN001   : 'sm-001',
        SHIMEN002   : 'sm-002',
        SHIMEN003   : 'sm-003',
        SHIMEN004   : 'sm-004',
        SHIMEN005   : 'sm-005',
        SHIMEN006   : 'sm-006',
        SHIMEN007   : 'sm-007',
        SHIMEN008   : 'sm-008',
        SHIMEN009   : 'sm-009',
        SHIMEN010   : 'sm-010',
        SHIMEN011   : 'sm-011',
        SHIMEN012   : 'sm-012',
        SHIMEN013   : 'sm-013',
        SHIMEN014   : 'sm-014',
        SHIMEN015   : 'sm-015',

        BANGPAI_SY      : '帮派任务-送药',
        BANGPAI_SJCL    : '帮派任务-收集材料',
        BANGPAI_CSMS    : '帮派任务-除蛇灭鼠',
        BANGPAI_TJWZ    : '帮派任务-囤积物资',
        BANGPAI_SJYP    : '帮派任务-收集药品',
    },

    GUIDE_ID    : {
        AUTO_FIGHT      : 18,   // 自动战斗
        EQUIP_WEAPON    : 19,   // 穿戴武器
        APPLY_XLCHI     : 20,   // 使用血池灵池
        APPLY_XSJ       : 22,   // 使用驯兽诀
        LEARN_PHY_SKIL  : 30,   // 学习物理偏向技能
        SUMMON_GUARD    : 25,   // 守护召唤
    },

    OBJECT_TYPE : {
        CHAR        : 0x0001,
        MONSTER     : 0x0002,
        NPC         : 0x0004,
        SPECIAL_NPC : 0x0040,
        GATHER      : 0x0080,
    },

    FAMILY_BOSS : {
        undefined   : '',
        1           : '文殊天尊',
        2           : '云中子',
        3           : '龙吉公主',
        4           : '太乙真人',
        5           : '石矶娘娘',
    },
}
