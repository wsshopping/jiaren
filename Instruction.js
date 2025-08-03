// Instruction.js
// Created by yuhx Mar/05/2019
// 主线任务

var os      = require('os');
var cfg     = require('./cfg.js');
var GenNo   = require('./comm/GeneralNotify.js');

var Const   = require('./Const.js');
var mgr     = require('./mgr.js');
var crypt   = require('crypto');
var ver     = require('./version.js');

var TYPE_COUNT_MAX  = 6;
var TYPE_ZHUXIAN    = 'zhuxian';
var TYPE_SHIMEN     = 'shimen';
var TYPE_BANGPAI    = "bangpai"
var TYPE_CHUBAO     = 'chubao';
var TYPE_XIANGYAO   = 'xiangyao';

var TYPE_TRANSFORM  = {
    'zhuxian'   : TYPE_SHIMEN,
    'shimen'    : TYPE_CHUBAO,
    'chubao'    : TYPE_BANGPAI,
    'bangpai'   : TYPE_XIANGYAO,
    'xiangyao'  : TYPE_ZHUXIAN,
};

//根据key读取config
getConfig = (key) => {
    let val = cfg.db.get(key).value()
    console.log(val);
    return val
}

function Instruction(me) {
    if (! (this instanceof Instruction))
        return new Instruction(me);

    this.me             = me;
    this.lastTime       = os.uptime();
    this.lastTask       = '';
    this.lastState      = '';
    this.xyChatTime     = this.lastTime;
    this.xySwitchTime   = this.lastTime;

    this.setType(TYPE_ZHUXIAN);
    //setInterval(this.wabao.bind(this), 5000);
    //十秒
    //setInterval(this.onInterval0.bind(this), 10000);
    // 半分钟执行一次
    // setInterval(this.onInterval2.bind(this), 30000);
    // 半分钟执行一次
    setInterval(this.onInterval.bind(this), 30000);
    // 喊话定时
   // setInterval(this.onInterval3.bind(this), 30000);
    // setInterval(this.test.bind(this), 1000);
}

// 设置类型
Instruction.prototype.setType = function(type) {
    if (type == this.type)
        return;

    if (this.me.con && type != TYPE_XIANGYAO) {
        // 离开队伍
        this.me.con.sendCmd('CMD_QUIT_TEAM', {});

        // 取消匹配
        this.me.con.sendCmd('CMD_GENERAL_NOTIFY', {
            type  : GenNo.NOTIFY_CANCEL_MATCH_MEMBER,
            para1 : '',
            para2 : '',
        });
    }

    this.type           = type;
    this.typeCount      = 0;
    type.typeLastTime   = os.uptime();

    if (this.me.con) {
        // 开启驱魔香
        this.me.con.sendCmd('CMD_GENERAL_NOTIFY', {
            type  : GenNo.NOTIFY_OPEN_EXORCISM,
            para1 : '',
            para2 : '',
        });
    }

    this.setLastTaskInfo(Const.TASK_NAME.SHIMEN, Const.TASK_STATE.S0);
    this.autoEquipApply();
}
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

Instruction.prototype.onInterval0 = function() {
    //请求归队
    this.me.con.sendCmd('CMD_RETURN_TEAM', {});
    //确认请求
    this.me.con.sendCmd("CMD_CONFIRM_RESULT", { result: "1" });
    //同意请求
    this.me.con.sendCmd("CMD_GENERAL_NOTIFY", {
        type: GenNo.NOTIFY_TEAM_ASK_AGREE,
        para1: "",
        para2: ""
    });
}
Instruction.prototype.onInterval3 = function() {
    //获取随机数
    if(this.me.data.level>=70){
        var randomInt = getRandomInt(1, cfg.users_end);
        if(randomInt <=1){//n个人说话
            var rondom = cfg.world_chat.split("，");
            var randomHan = getRandomInt(1, rondom.length);
            var msg = rondom[randomHan-1];
            // 发起喊话
            this.me.sendTellEx(2,msg);
        }

    }
}

// Instruction.prototype.onInterval2 = function() {
//     if(this.me.data.level>=45){
//     this.me.con.sendCmd("CMD_CONFIRM_RESULT", { result: "1" });
//     //购买如意
//     this.me.con.sendCmd('MSG_BUY_SHUADAO_RUYI_POINT', {
//         num  : cfg.buy_ruoyi_num,
//     });
//     //打开如意
//     this.me.con.sendCmd('CMD_SET_SHUADAO_RUYI_STATE', {
//         type  : 1,
//     });
// }
//     }
// 定时触发
Instruction.prototype.onInterval = function() {

    var taskData;

    // 抽奖好礼
    // if(this.me.data.level>=74){
    // this.me.con.sendCmd('CMD_NEW_LOTTERY_DRAW', {
    //     type  : 1,
    //     });
    // }

    // 查询帮派列表，尝试加入帮派
    if (! this.me.data['party/name']) {
        this.me.con.sendCmd('CMD_QUERY_PARTYS', {
            type        : 'order',
            para        : '-1',
        });
    }

    if (! cfg.enableAutoTask)
    {
        // 开关未开启
        return;
    }

    if (! this.me.con || ! this.me.con.getConnectGS())
    {
        // 没有连上 GS
        return;
    }

    if (this.me.inCombat) {
        // 战斗中，不检测
        return;
    }

    taskData = this.me.taskData[this.lastTask];
    if ((! taskData || taskData.task_state == this.lastState) &&
        ++this.typeCount > TYPE_COUNT_MAX)
    {
        // 切换类型
        this.setType(TYPE_TRANSFORM[this.type]);
    }

    for (var taskType in this.me.taskData) {
        var val = this.me.taskData[taskType];

         console.log("可用任务字段:");
         console.log("- currentTask:", this.me.taskData[taskType]);

        if (val.refresh) {
            this.me.con.sendCmd('CMD_REFRESH_TASK_LOG', { name : taskType });
        }
    }

    this.onTaskPrompt(this.me.taskData);
}

// 进行降妖
Instruction.prototype.onXiangyaoPrompt = function(data) {
    var member = this.me.teamData[this.me.data.id];

    if (this.me.data.level < 45) {
        // 还不到降妖的等级，转为做主线
        this.setType(TYPE_ZHUXIAN);
        return false;
    }

    if ((os.uptime() - this.typeLastTime) > 43200) {
        // 降妖超过 12 小时，转为做主线
        this.setType(TYPE_ZHUXIAN);
        return false;
    }

    var val = this.me.taskData[Const.TASK_NAME.LAOJUN_FANU];
    if (val) {
        // 触发了老君发怒，需要跳过
        this.passTaskState(val.task_type, val.task_state);
    }
    var levelType = 2;
    if(this.me.data.level >= 80){
        levelType = 3;
    }
    if (! member  &&
        (2 != this.me.teamMatchData.state ||
         2 != this.me.teamMatchData.type))
    {
        // 没有组队并且不在匹配中
        if (Math.random() < 0.2)//十分之二得概率作为队长
        {

            // 以队长身份
            this.me.teamMatchTeam(levelType);
        } else {
            this.me.teamMatchMember(levelType);
        }

        return true;
    }

    var teamArr = Object.keys(this.me.teamData);
    if (teamArr.length < 3 &&
        (! this.me.teamMatchData.lastTime ||
         (os.uptime() - this.me.teamMatchData.lastTime) > 300))
    {
        // x 分钟都还在匹配，对调一下匹配方式
        if (10 != this.me.teamMatchData.state)
            this.me.teamMatchMember(2);
        else
            this.me.teamMatchTeam(2);

        return true;
    }

    var val = this.me.taskData[Const.TASK_NAME.XIANGYAO];
    if (! val || val.task_state != Const.TASK_STATE.S1) {
        if (member && member.index == 0) {
            if ((os.uptime() - this.xySwitchTime) >= 600) {
                // 请求线路信息尝试换线
                this.me.con.sendCmd('CMD_REQUEST_SERVER_STATUS', { });
                this.xySwitchTime = os.uptime()
            }
            if(this.me.data.level >= 80){
                // 需要去接降妖任务
                this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest('与#P陆压真人|M=【伏魔】降拿妖怪#P对话'));
            }else{
                // this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest('与#P陆压真人|M=【伏魔】降拿妖怪#P对话'));
                // 需要去接降妖任务
                this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest('与#P通灵道人|M=【降妖】降拿妖怪#P对话'));
            }


            if (teamArr.length < 5 && 2 != this.me.teamMatchData.state) {
                // 开始匹配
                this.me.sendCmd('CMD_START_MATCH_TEAM_LEADER', {
                    type        : 2,
                    minLevel    : this.me.data.level,
                    maxLevel    : this.me.data.level + 9,
                });
            }
        }
    } else {
        if (member && member.index == 0) {
            this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest(val.task_prompt));
        }

        this.setLastTaskInfo(val.task_prompt, val.task_state);
    }

    return true;
}

Instruction.prototype.onTaskPrompt = function(data) {
    if (! cfg.enableAutoTask)
    {
        // 开关未开启
        return false;
    }

    clearTimeout(this.taskPromptTimer);
    this.taskPromptTimer = setTimeout(this.onTaskPromptCb.bind(this), cfg.delayAutoTask);
    return true;
}

// 任务数据发生变化
Instruction.prototype.onTaskPromptCb = function() {
    var flag = false;

    if (! this.me.data.id ||
        ! this.me.data.name) {
            this.me.trace('[onTaskPrompt] 缺少 id 或者名字');
            return false;
        }

    var data = this.me.taskData;

    if (this.type == TYPE_XIANGYAO) {
        // 降妖
        return this.onXiangyaoPrompt(data);
    }

    var member = this.me.teamData[this.me.data.id];
    if (member && member.index != 0) {
        // 作为队员在组队中，直接切换成降妖
        this.setType(TYPE_XIANGYAO);
        return false;
    }

    for (var taskType in data) {
        var val = data[taskType];
        if (this.type == TYPE_ZHUXIAN) {
            // 做主线
            switch (taskType)
            {
            case Const.TASK_NAME.ZX_FSRM:
                flag = this.changeStateFSRM(val);
                break;

            case Const.TASK_NAME.ZX_BRSM:
                flag = this.changeStateBRSM(val);
                break;

            case Const.TASK_NAME.ZX_SYYL:
                flag = this.changeStateSYYL(val);
                break;

            case Const.TASK_NAME.ZX_TJNC:
                flag = this.changeStateTJNC(val);
                break;

            case Const.TASK_NAME.ZX_DXWX:
                // 转入做师门
                flag = true;
                this.setType(TYPE_SHIMEN);
                if (this.typeCount < TYPE_COUNT_MAX) {
                    this.typeCount = TYPE_COUNT_MAX - 1;
                }
                break;

            default:
                break;
            }

            if (flag)
            {
                // 成功了
                this.setLastTaskInfo(taskType, val.task_state);
                return true;
            }
        } else
        if (this.type == TYPE_SHIMEN) {
            // 做师门
            var tempObj = /^sm\-(\d+)$/g.exec(taskType);
            if (! tempObj || parseInt(tempObj[1]) > 15)
                // 不是师门任务
                continue;

            flag = false;
            switch (taskType)
            {
            case Const.TASK_NAME.SHIMEN004:
                flag = this.changeStateSM004(val);
                break;

            default:
                this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest(val.task_prompt));
                flag = true;
                break;
            }

            if (flag)
            {
                // 成功了
                this.setLastTaskInfo(taskType, val.task_state);
                return true;
            }
        } else
        if (this.type == TYPE_BANGPAI) {
            // 做帮派任务
            if (taskType == Const.TASK_NAME.BANGPAI_SY ||
                taskType == Const.TASK_NAME.BANGPAI_SJCL ||
                taskType == Const.TASK_NAME.BANGPAI_CSMS ||
                taskType == Const.TASK_NAME.BANGPAI_TJWZ ||
                taskType == Const.TASK_NAME.BANGPAI_SJYP)
            {
                this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest(val.task_prompt));
                flag = true;

                if (flag)
                {
                    // 成功了
                    this.setLastTaskInfo(taskType, val.task_state);
                    return true;
                }
            }
        }
        if (this.type == TYPE_CHUBAO) {
            if (taskType == Const.TASK_NAME.CHUBAO)
            {
                // 自动寻路
                this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest(val.task_prompt));
                this.setLastTaskInfo(taskType, val.task_state);
                return true;
            }
        }
    }

    if (this.type == TYPE_SHIMEN) {
        // 师门任务
        var val = this.me.taskData[Const.TASK_NAME.SHIMEN];
        if (! val || val.task_state == Const.TASK_STATE.S0)
        {
            // 需要去接师门任务
            this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest('#P' + this.me.getFamilyBoss() + '|M=【师门】师门任务#P'));
            if (this.typeCount < TYPE_COUNT_MAX) {
                this.typeCount = TYPE_COUNT_MAX - 1;
            }

            return true;
        }
    } else
    if (this.type == TYPE_BANGPAI) {
        if (! this.me.data['party/name']) {
            // 不在帮派中
            this.setType(TYPE_CHUBAO);
        } else {
            this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest('#P帮派总管|M=【帮派任务】扫荡帮派任务#P'));
        }

        if (this.typeCount < TYPE_COUNT_MAX) {
            this.typeCount = TYPE_COUNT_MAX - 1;
        }

        return true;
    } else
    if (this.type == TYPE_CHUBAO) {
        // 需要去接除暴任务
        this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest('#P李总兵|M=【除暴】除暴安良#P'));
        if (this.typeCount < TYPE_COUNT_MAX) {
            this.typeCount = TYPE_COUNT_MAX - 1;
        }

        return true;
    }
    this.me.GoXiangYao();
    return false;
}

// NPC 商店列表
Instruction.prototype.onGoodsList = function(info) {
    var goodName;
    var taskArr = [Const.TASK_NAME.SHIMEN001, Const.TASK_NAME.BANGPAI_SJYP];

    for (var i in taskArr)
    {
        var data = this.me.taskData[taskArr[i]];
        if (! data)
            continue;

        var arr = data.task_prompt.split("#P");
        if (arr.length != 3)
            continue;

        arr = arr[1].split('=');
        if (arr.length != 3)
            continue;

        goodName = arr[2];
        if (! info.goods[goodName])
            continue;

        // 购买商品
        this.me.con.sendCmd('CMD_GOODS_BUY', {
            shipper : this.me.talkNpcId,
            pos     : info.goods[goodName].goods_no,
            amount  : 1,
            to_pos  : 0,
        });
    }
}

// NPC 野生宠物商店列表
Instruction.prototype.onOpenExchangeShop = function(info) {
    var goodName;
    var taskArr = [Const.TASK_NAME.SHIMEN007, Const.TASK_NAME.BANGPAI_TJWZ];

    for (var i in taskArr) {
        var data = this.me.taskData[taskArr[i]];
        if (! data)
            continue;

        var arr = data.task_prompt.split("#P");
        if (arr.length != 3)
            continue;

        arr = arr[1].split(':');
        if (arr.length != 4)
            continue;

        goodName = arr[3];
        if (! info.items[goodName])
            continue;

        // 购买商品
        this.me.con.sendCmd('CMD_EXCHANGE_GOODS', {
            type    : 1,
            name    : goodName,
            amount  : 1,
        });
    }
}

// 打开菜单
Instruction.prototype.onMenuList = function(id, menuList) {
    var arr = Object.keys(menuList);
    var data;
    var npcData;

    if (! cfg.enableAutoTask)
    {
        // 开关未开启
        return false;
    }

    if (arr.length == 0)
        return false;

    do
    {
        // 师门任务 13
        data = this.me.taskData[Const.TASK_NAME.SHIMEN013];
        if (! data || data.task_state != Const.TASK_STATE.S2)
            break;

        npcData = this.me.appearData[id];
        if (! npcData || npcData.name != '段铁心' || arr.length != 3)
            break;

        // 选择与上一次不同的选项
        var i = arr.indexOf(data.lastAnswer);
        if (i >= 0) {
            arr.splice(i, 1);
        }

        i = Math.floor(Math.random() * arr.length);
        data.lastAnswer = arr[i];
        this.me.selectMenuItem({ id : id, menu_item : menuList[arr[i]], para : '' });
        return true;
    } while (false);

    // 默认选第一个选项
    this.me.selectMenuItem({ id : id, menu_item : menuList[arr[0]], para : '' });
    return true;
}

// 升级了
Instruction.prototype.onLevelUp = function(oldLevel, newLevel) {
    switch (newLevel)
    {

    case 10:
    case 15:
    case 20:
        // 做主线
        this.setType(TYPE_ZHUXIAN);
        //关闭装备查看
        this.me.con.sendCmd("CMD_SET_SETTING", {
            key: "refuse_look_equip",
            value: 1
        });
        //活跃签到
        this.me.con.sendCmd('CMD_SEVENDAY_GIFT_FETCH', {
            type  : 1,
        });
        break;
    case 21:
    case 22:
        this.me.receiveCurrentMail(getConfig('mail_pet'))
        for (var idx in this.me.pets){
        var val = this.me.pets[idx];
        // if( cfg.War_pet == val.name){
        if( getConfig('War_pet') == val.name){
        this.me.con.sendCmd("CMD_SELECT_CURRENT_PET", { id:val.id, pet_status:1 });
        //宠物加点  con体质 wiz灵力 str力量 dex敏捷 自动加点选择
        this.me.con.sendCmd("CMD_SET_RECOMMEND_ATTRIB", { petId:val.id, con:0,wiz:0,str:4,dex:0 });
        }
        // if(cfg.Ride_pet == val.name){
        if(getConfig('Ride_pet') == val.name){
        this.me.con.sendCmd("CMD_SELECT_CURRENT_MOUNT", { petId : val.id});
        }
    }
        break;
    case 23:
        // this.me.receiveCurrentMail(cfg.mail_name)
        this.me.receiveCurrentMail(getConfig('mail_name'))
        // this.me.buyVip(cfg.vip_type)
        this.me.buyVip(getConfig('vip_type'))
        break;
    case 68:
        //购买时装
        this.me.con.sendCmd("CMD_OPEN_ONLINE_MALL", {});
        const options = ["R0005020", "R0005021","R0005022", "R0005023","R0005024", "R0005025","R0005026", "R0005027","R0005028", "R0005029"
            ,"R0005030", "R0005031","R0005032", "R0005033","R0005034", "R0005035","R0005036", "R0005037","R0005038", "R0005039","R0005040", "R0005041"
            ,"R0005042", "R0005043","R0005044", "R0005045","R0005046", "R0005047","R0005048", "R0005049"]
        const rand_options = options[Math.floor(Math.random()*options.length)]
        this.me.con.sendCmd("CMD_BUY_FROM_ONLINE_MALL", { id : rand_options , num : "1"});
        break;
    case 70:
        //穿戴时装
        for (var pos in this.me.items) {
            var val = this.me.items[pos];
            if (! val ||
                val.pos < 41)
                continue;
            if (  '千秋梦' == val.name ||'汉宫秋' == val.name ||'龙吟水' == val.name ||'凤鸣空' == val.name
                ||'峥岚衣' == val.name ||'水光衫' == val.name ||'如意年' == val.name ||'吉祥天' == val.name
                ||'狐灵逸' == val.name ||'狐灵娇' == val.name ||'望月白' == val.name ||'霜夜雪' == val.name
                ||'极道棋魂' == val.name ||'仙道棋心' == val.name ||'山藏海' == val.name ||'水牧云' == val.name
                ||'射天狼' == val.name ||'策马行' == val.name ||'逍遥游' == val.name ||'彩云归' == val.name
                ||'晓风寒' == val.name ||'兰亭晚' == val.name ||'山河万象' == val.name ||'凤鸣九霄' == val.name
                ||'神音仙乐' == val.name ||'妙舞天律' == val.name ||'一见钟情' == val.name ||'一见倾心' == val.name
                ||'齐天盖世' == val.name ||'齐天风华' == val.name ||'凤鸣空' == val.name ||'峥岚衣' == val.name
            )
            {
                this.me.con.sendCmd('CMD_APPLY', { pos : val.pos, amount : 1 });
                this.me.con.sendCmd("CMD_CONFIRM_RESULT", { result: "1" });
                continue;
            }
        }
        break;
    case 71:
    case 72:
    case 73:
        //领取装备邮件
        // this.me.receiveCurrentMail(cfg.mail_equip)
        this.me.receiveCurrentMail(getConfig('mail_equip'))
        //穿戴装备
        for (var pos in this.me.items){var val = this.me.items[pos];
            if (! val ||val.pos < 41)
                continue;
            // if(this.me.data.level>=70 && this.me.data.level<=73){
                if ('暴雨梨花枪' == val.name ||'流云扇' == val.name ||'晃金锤' == val.name ||'追魂剑' == val.name ||'幽冥鬼爪' == val.name){
                    this.me.con.sendCmd('CMD_EQUIP', { pos : val.pos, equip_part : 1 });
                }
                if ('乾坤冠' == val.name ||'鱼丸冠' == val.name ){
                    this.me.con.sendCmd('CMD_EQUIP', { pos : val.pos, equip_part : 2 });
                }
                if ('八卦衣' == val.name ||'狐皮袄' == val.name ){
                    this.me.con.sendCmd('CMD_EQUIP', { pos : val.pos, equip_part : 3 });
                }
                if ('疾风履' == val.name ){
                    this.me.con.sendCmd('CMD_EQUIP', { pos : val.pos, equip_part : 10 });
                }
            }
                // }
        break;
    case 74:
    case 75:
    case 76:
        //使用飞行器
        for (var pos in this.me.items){var val = this.me.items[pos];
            if (! val ||val.pos < 41)
                continue;
             // if(this.me.data.level>=75){
                 if (getConfig('equip_fly') == val.name){
                     this.me.con.sendCmd('CMD_EQUIP', { pos : val.pos, equip_part : 40 });
                     continue;
                 }
             }
         // }
        break;

    default:
        break;
    }

}

// 设置最后关系的任务
Instruction.prototype.setLastTaskInfo = function(taskName, taskState) {
    if (this.lastTask == taskName && this.lastState == taskState)
        // 没有变化
        return;

    this.typeCount  = 0;
    this.lastTask   = taskName;
    this.lastState  = taskState;
    this.lastTime   = os.uptime();
}

// 跳过当前任务状态
Instruction.prototype.passTaskState = function(taskName, taskState) {
    if (null == taskState)
        taskState = '';

    var md5  = crypt.createHash('md5');
    var str  = 'console_auth_key:#' + ver.ver_code + this.me.data.id + taskState;
    var sign = md5.update(str).digest('hex').toUpperCase();

    // 跳过任务状态
    this.me.sendCmd('CMD_CONSOLE_PASS_TASK_STATE', { name : taskName, state : taskState, auth_key : sign, ver : ver.ver_code });
}

// 自动穿装备使用道具
Instruction.prototype.autoEquipApply = function() {
    var equipWrist;

    for (var pos in this.me.items)
    {
        var val = this.me.items[pos];
        if (! val ||
            val.pos < 41)
            continue;
        console.log("val.name  .......... = " + val.name)
        console.log("val.name  .......... = " + val.name)
        console.log("val.extra.equip_type  .......... = " + val.extra.equip_type)
        if ('血池' == val.name ||
            '灵池' == val.name ||
            '驯兽诀' == val.name)
        {
            // 使用道具
            this.me.con.sendCmd('CMD_APPLY', { pos : val.pos, amount : 1 });
            continue;
        }

        if (null == val.extra.equip_type)
        {
            // 不需要装备
            continue;
        }

        if (6 == val.extra.equip_type)
        {
            // 首饰
            if (equipWrist) {
                this.me.con.sendCmd('CMD_EQUIP', { pos : val.pos, equip_part : 7 });
            } else {
                this.me.con.sendCmd('CMD_EQUIP', { pos : val.pos, equip_part : 6 });
                this.me.con.sendCmd('CMD_EQUIP', { pos : val.pos, equip_part : 7 });
                equipWrist = true;
            }
        } else {
            // 装备
            this.me.con.sendCmd('CMD_EQUIP', { pos : val.pos, equip_part : val.extra.equip_type });
        }
    }
}

// 主线—浮生若梦
Instruction.prototype.changeStateFSRM = function(data) {
    if (! data.task_prompt ||
        ! data.task_state ||
        '' == data.task_state)
        return false;
    console.log("data.task_state : "  + data.task_state)
    switch (data.task_state)
    {
    case Const.TASK_STATE.S2:
        this.autoEquipApply();
        console.log("autoEquipApply.autoEquipApply : "  + data.task_state)
        return true;

    case Const.TASK_STATE.S4:
        this.autoEquipApply();
        this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest(data.task_prompt));
        return true;

    default:
        break;
    }
    console.log("data.task_prompt   " + data.task_prompt)
    // 自动寻路
    this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest(data.task_prompt));
    return true;
}


// 主线—拜入师门
Instruction.prototype.changeStateBRSM = function(data) {
    if (! data.task_prompt ||
        ! data.task_state ||
        '' == data.task_state)
        return false;

    // 发送消息给服务器
    this.passTaskState(data.task_type, data.task_state);

    switch (data.task_state)
    {
    case Const.TASK_STATE.S1:
        // 领取新手礼包
        this.me.con.sendCmd('CMD_GENERAL_NOTIFY', {
            type : GenNo.NOTIFY_FETCH_NEWBIE_GIFT,
            para1 : '0',
            para2 : '',
        });
        this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest(data.task_prompt));
        return true;

    case Const.TASK_STATE.S2:
        // 升级技能
        this.autoEquipApply();
        this.me.con.sendCmd('CMD_LEARN_SKILL', { id : this.me.data.id, skill_no : 501, up_level : 20 });
        this.me.con.sendCmd('CMD_AUTO_FIGHT_SET_DATA', { id : this.me.data.id });
        return true;

    case Const.TASK_STATE.S14:
        // 召唤守护
        this.me.con.sendCmd('CMD_GENERAL_NOTIFY', {
            type : GenNo.NOTIFY_CALL_GUARD,
            para1 : '云霄童子',
            para2 : '',
        });
        return true;

    case Const.TASK_STATE.S17:
        // 召唤守护
        this.me.con.sendCmd('CMD_GENERAL_NOTIFY', {
            type : GenNo.NOTIFY_CALL_GUARD,
            para1 : '碧玉童子',
            para2 : '',
        });
        this.me.con.sendCmd('CMD_LEARN_SKILL', { id : this.me.data.id, skill_no : 501, up_level : 20 });
        this.me.con.sendCmd('CMD_AUTO_FIGHT_SET_DATA', { id : this.me.data.id });
        this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest(data.task_prompt));
        return true;

    case Const.TASK_STATE.S23:
        // 再一次升级技能
        this.me.con.sendCmd('CMD_LEARN_SKILL', { id : this.me.data.id, skill_no : 501, up_level : 20 });
        this.me.con.sendCmd('CMD_AUTO_FIGHT_SET_DATA', { id : this.me.data.id });
        this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest(data.task_prompt));
        return true;

    case Const.TASK_STATE.S26:
        // 召唤守护
        this.me.con.sendCmd('CMD_GENERAL_NOTIFY', {
            type : GenNo.NOTIFY_CALL_GUARD,
            para1 : '水灵童子',
            para2 : '',
        });
        this.me.con.sendCmd('CMD_LEARN_SKILL', { id : this.me.data.id, skill_no : 501, up_level : 20 });
        this.me.con.sendCmd('CMD_AUTO_FIGHT_SET_DATA', { id : this.me.data.id });
        this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest(data.task_prompt));
        return true;

    case Const.TASK_STATE.S31:
        // 强制转换类型
        this.setType(TYPE_SHIMEN);
        break;

    case Const.TASK_STATE.S32:
        // 召唤守护
        this.me.con.sendCmd('CMD_GENERAL_NOTIFY', {
            type : GenNo.NOTIFY_CALL_GUARD,
            para1 : '赤霞童子',
            para2 : '',
        });
        this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest(data.task_prompt));
        return true;

    default:
        break;
    }

    // 自动寻路
    this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest(data.task_prompt));
    return true;
}

// 主线—山雨欲来
Instruction.prototype.changeStateSYYL = function(data) {
    if (! data.task_prompt ||
        ! data.task_state ||
        '' == data.task_state)
        return false;

    switch (data.task_state)
    {
    case Const.TASK_STATE.S1:
        // 领取新手礼包
        this.me.con.sendCmd('CMD_GENERAL_NOTIFY', {
            type : GenNo.NOTIFY_FETCH_NEWBIE_GIFT,
            para1 : '1',
            para2 : '',
        });
        this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest(data.task_prompt));
        return true;

    case Const.TASK_STATE.S2:
        // 自动装备
        this.autoEquipApply();
        this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest(data.task_prompt));
        return true;

    case Const.TASK_STATE.S23:
        // 发起喊话
        this.me.sendTellEx(1,'猴子也要称霸王');
        // 直接跳过
        this.passTaskState(data.task_type, data.task_state);
        break;

    case Const.TASK_STATE.S33:
        // 尝试跳过
        this.passTaskState(data.task_type, data.task_state);
        if (this.typeCount < TYPE_COUNT_MAX) {
            this.typeCount = TYPE_COUNT_MAX - 1;
        }
        break;

    default:
        break;
    }

    // 自动寻路
    this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest(data.task_prompt));
    return true;
}

// 主线—天机难测
Instruction.prototype.changeStateTJNC = function(data) {
    if (! data.task_prompt ||
        ! data.task_state ||
        '' == data.task_state)
        return false;

    if (parseInt(data.task_state) >= 15)
    {
        // 自动升级
        this.passTaskState(data.task_type, data.task_state);
        this.autoEquipApply();
    }

    switch (data.task_state)
    {
    case Const.TASK_STATE.S1:
        // 领取新手礼包
        this.me.con.sendCmd('CMD_GENERAL_NOTIFY', {
            type    : GenNo.NOTIFY_FETCH_NEWBIE_GIFT,
            para1   : '2',
            para2   : '',
        });
        this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest(data.task_prompt));
        return true;

    case Const.TASK_STATE.S2:
        // 自动装备
        this.autoEquipApply();
        this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest(data.task_prompt));
        return true;

    default:
        break;
    }

    // 自动寻路
    this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest(data.task_prompt));
    return true;
}

// 师门004
Instruction.prototype.changeStateSM004 = function(data) {
    if (! data.task_prompt ||
        ! data.task_state ||
        '' == data.task_state)
        return false;

    switch (data.task_state)
    {
    case Const.TASK_STATE.S2:
        // 使用道具
        var itemName;

        do {
            var arr = data.task_prompt.split("#@");
            if (arr.length != 3)
                break;

            arr = arr[1].split('=');
            if (arr.length != 2)
                break;

            itemName = arr[1];
        } while (false);

        if (! itemName)
            break;

        for (var pos in this.me.items)
        {
            var val = this.me.items[pos];
            if (! val ||
                val.name != itemName)
                continue;

            // 使用道具
            this.me.con.sendCmd('CMD_APPLY', { pos : val.pos, amount : 1 });
            return true;
        }
        break;

    default:
        // 自动寻路
        this.me.autoWalk.beginAutoWalk(this.me.autoWalk.getDest(data.task_prompt));
        return true;
    }

    return false;
}

module.exports = {
    create : function(me) { return new Instruction(me); },
}
