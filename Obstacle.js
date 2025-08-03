// obstacle.js
// Created by huangzz July/13/2018
// 障碍点解析

var os      = require('os');
var cfg     = require('./cfg.js');
var genNo   = require('./comm/GeneralNotify.js');
var crypt   = require('crypto');
var http    = require('http');
var Const = require('./Const.js');

var fs = require('fs')
var zlib = require('zlib')
var parseXml = require('xml2js').parseString

var TRUE = true
var FALSE = false
var NULL = null

function pad(num, n) {
    var str = ''+ num
    var length = str.length
    return Array(n > length ? (n - length + 1) : 0).join(0) + num;
}

function assert(flag, err) {
    if (!flag) {
        throw new Error(err);
    }
}

function Point(x, y) {
    return {x : x, y : y}
}

var SEARCHWIDTH   = 400;  // 搜索范围的半径大小
var SEARCHHEIGHT  = 400;  // 搜索范围的半径大小
var STATE_EMPTY = 0       // 未用
var STATE_ADDED = 1       // 已加入列表
var STATE_PASSED = 2       // 已走过

var MAX_NEXT_POS_COUNT   = 1000     // 下一步可走位置的最大数量
var MAX_POS_LIST_COUNT   = 1000;         // 路径关键点最大数量
var tmxInfos = {} // 存每一张地图对应的信息
var pGrids = {}   // 存每一张地图对应的障碍点信息

var m_pInfo = null   // 位置信息
var m_pPath = null   // 路径
var m_pNextPosList = null   // 下一步可走的位置
var m_pPathInfo = null      // 行走路径

function Obstacle(connection) {
    if (! (this instanceof Obstacle))
        return new Obstacle(connection);
    this.m_nRow      = null;  // 行数
    this.m_nColumn   = null;  // 列数
    this.m_pGrids    = [];    // 记录障碍信息（1表示障碍，0表示非障碍）
    this.m_dwNextPosCount = 0   // 下一步可走的位置的数量
    this.m_fFindTime = null;    // 搜索时间
    m_pPathInfo = null;    // 行走路径

    this.m_bShow = false;                // 是否显示障碍信息
    this.m_startPos = {};             // 起始位置
    this.m_curPos = {};                // 当前位置
    this.m_endPos = {};                // 目标位置
    this.m_bestPos = {};                // 距离目标最近的位置
    this.m_fBestValue = 0;            // 与目标最近的距离
}

// 记录障碍点的标记为 4 个位，若 4 个位都为 0 则为非障碍点
function getObstacleFlag(data, i, j) {
    for (; i <= j; i++){
        if (data[i] > 0) {
            return 1
        }
    }

    return 0
}

Obstacle.prototype.genMapInfo = function(mapId, info) {
    var i = 0;
    for (i = 0; i < info.map.layer.length; ++i)
    {
        if (info.map.layer[i].$.name == "obstacle")
            break;
    }

    if (i == info.map.layer.length)
    {
        console.log("Not found obstacle info")
        return;
    }

    if (! info.map.$.width || ! info.map.$.tilewidth)
    {
        console.log("Not found size info")
        return;
    }

    var mapSize = {width : info.map.$.width, height : info.map.$.height}
    var contentSize = {width : info.map.$.width * info.map.$.tilewidth, height : info.map.$.height * info.map.$.tileheight}

    var data = new Buffer(info.map.layer[i].data[0]._, 'base64');
    if (info.map.layer[i].data[0].$.compression == "zlib")
    {
        var self = this
        zlib.unzip(data, function(err, buf)
        {
            if (err)
            {
                console.log(err);
                return;
            }

            self.setMapInfo(mapId, {data:buf, mapSize : mapSize, contentSize : contentSize})
        })
        return;
    }

    this.setMapInfo(mapId, {data:data, mapSize : mapSize, contentSize : contentSize})
}

Obstacle.prototype.readMapFile = function(mapId) {
    var info
    var self = this
    try {
        var fileName = "tmx/" + pad(mapId, 5) + ".tmx"
        var data = fs.readFileSync(fileName)

        parseXml(data.toString(), function(err, ret) {
            if (err) {
                console.log(err)
            } else {
                self.genMapInfo(mapId, ret)
            }
        })
    } catch (error) {
        console.log(error);
    }
}

Obstacle.prototype.changeMap = function(mapId) {
    this.curMapId = mapId
    if (tmxInfos[mapId]) {
        this.setMapInfo(mapId, tmxInfos[mapId])
    } else {
        this.readMapFile(mapId)
    }
}

Obstacle.prototype.setMapInfo = function(mapId, tmxInfo) {
    tmxInfos[mapId] = tmxInfo

    if (this.curMapId != mapId){
        return;
    }

    var size = tmxInfo.contentSize;
    var obstacle = tmxInfo.data;
    var mapSize = tmxInfo.mapSize;
    if (obstacle == null)
        return false;

    this.m_nRow      = Math.floor((size.height + Const.PANE_HEIGHT - 1) / Const.PANE_HEIGHT);         // 行
    this.m_nColumn   = Math.floor((size.width + Const.PANE_WIDTH - 1) / Const.PANE_WIDTH);          // 列

    m_pInfo     = {};
    m_pPath     = {};
    m_pNextPosList = {};
    this.m_fFindTime = 0.0;

    // 记录行
	if (pGrids[mapId]){
		this.m_pGrids = pGrids[mapId]
	}else {
		var grids = []

		for (var i = 0; i < (this.m_nRow * this.m_nColumn); i++){
			grids[i] = 0
		}

		for (var y = 0; y < this.m_nRow; y++){
			// 记录列
			for (var x = 0; x < this.m_nColumn; x++){
				grids[y * this.m_nColumn + x] = getObstacleFlag(obstacle, (x + y * mapSize.width) * 4, (x + y * mapSize.width) * 4 + 3);
			}
		}

		 pGrids[mapId] = grids
		 this.m_pGrids = grids
	}

    return true;
}

Obstacle.prototype.FindPath = function(startX, startY, endX, endY)
{
    try {
        if (! tmxInfos[this.curMapId]){
            return;
        }

        if (m_pPathInfo == null)
            m_pPathInfo = {};

        var nPosCount = this.GetPath(Point(startX, startY), Point(endX, endY), m_pPathInfo);

        if (nPosCount >= MAX_POS_LIST_COUNT)
            return;

        var pMap = new Array()
        for (var i = 0; i < nPosCount; ++i)
        {
            var info = {}
            info["x" + i] = Math.floor(m_pPathInfo[i].pos.x)
            info["y" + i] = Math.floor(m_pPathInfo[i].pos.y)
            info["len" + i] = Math.floor(m_pPathInfo[i].fLen)
            pMap.push(info)
        }

        return pMap;
    } catch (error) {
        console.log(error)
    }
}

// 寻路
Obstacle.prototype.GetPath = function(startPos, endPos, pPath)
{
    var i, j, m, n;
    var x = 0, y = 0;

    if (this.m_pGrids == NULL)
        return 0;

    // 如果前后两次所在的是同一点，则不寻路
    if (startPos.x == endPos.x && startPos.y == endPos.y)
        return 0;

    // 对起始点进行限制
    // 计算起始位置
    this.m_startPos.x = Math.floor(startPos.x / Const.PANE_WIDTH);
    this.m_startPos.y = Math.floor(startPos.y / Const.PANE_HEIGHT);

    // 调用者应该保证起点坐标正确
    assert(this.m_startPos.x >= 0 && this.m_startPos.x < this.m_nColumn, "起点坐标错误, map_id:" + this.curMapId);
    assert(this.m_startPos.y >= 0 && this.m_startPos.y < this.m_nRow, "起点坐标错误, map_id:" + this.curMapId);
    if (this.m_startPos.x < 0 || this.m_startPos.x  >= this.m_nColumn
        || this.m_startPos.y  < 0 || this.m_startPos.y >= this.m_nRow){
            return 0;
        }

    if (this.IsObstacle(this.m_startPos.x, this.m_startPos.y)){
        // 起始点不能为障碍
        console.log("IsObstacle");
        return 0;
    }

    // 对起始点进行限制
    // 计算起始位置
    this.m_endPos.x = Math.floor(endPos.x / Const.PANE_WIDTH);
    this.m_endPos.y = Math.floor(endPos.y / Const.PANE_HEIGHT);

    // 调用者应该保证起点坐标正确
    // 判断终点
    if (this.m_endPos.x  < 0 || this.m_endPos.x >= this.m_nColumn
        || this.m_endPos.y < 0 || this.m_endPos.y >= this.m_nRow){
            return 0;
        }

    // 清除位置信息
    for (i = 0; i < this.m_nRow * this.m_nColumn; i++){
        m_pInfo[i] = {}
        m_pInfo[i].fValue = 0x7fffffff;
        m_pInfo[i].state = STATE_EMPTY;
    }

    // 初始化
    this.m_curPos.x = this.m_startPos.x;
    this.m_curPos.y = this.m_startPos.y;
    m_pNextPosList[0] = this.m_curPos;
    this.m_bestPos = this.m_curPos;
    this.m_dwNextPosCount = 1;
    m_pInfo[this.m_curPos.y * this.m_nColumn + this.m_curPos.x].fCurValue = 0.0;
    this.m_fBestValue = this.Evaluate(this.m_curPos, this.m_endPos);

    while (!(this.m_curPos.x == this.m_endPos.x && this.m_curPos.y == this.m_endPos.y))
    {
        // 生成下一步可走的位置
        this.GenNextPos();

        // 调整下一步顺序
        this.AdjustNextPos();

        if (this.m_dwNextPosCount == 0)
        {
            // 无法走到目标位置
            this.m_curPos = this.m_bestPos;
            break;
        }

        // 设置下一个位置
        this.m_curPos = m_pNextPosList[this.m_dwNextPosCount - 1];

        if (this.Evaluate(this.m_curPos, this.m_endPos) < this.m_fBestValue)
        {
            // 更新与目标位置的最短距离
            this.m_fBestValue = this.Evaluate(this.m_curPos, this.m_endPos);

            // 更新最近位置
            this.m_bestPos = this.m_curPos;
        }
    }

    var tempPos;
    n = 0;

    // 取得路径关键点（逆序）
    while (!(this.m_curPos.x == this.m_startPos.x && this.m_curPos.y == this.m_startPos.y))
    {
        m_pPath[n++] = this.m_curPos;
        this.m_curPos = m_pInfo[this.m_curPos.y * this.m_nColumn + this.m_curPos.x].lastPos;
    }

    m_pPath[n++] = this.m_startPos;

    // 调整为顺序
    for (i = 0; i < Math.floor(n / 2); i++)
    {
        tempPos = m_pPath[i];
        m_pPath[i] = m_pPath[n - 1 - i];
        m_pPath[n - 1 - i] = tempPos;
    }

    // 转化为像素
    m_pPath[0].x = Math.floor(startPos.x);
    m_pPath[0].y = Math.floor(startPos.y);

    for (i = 1; i < n; i++)
    {
        m_pPath[i].x = m_pPath[i].x * Const.PANE_WIDTH + Const.PANE_WIDTH / 2;
        m_pPath[i].y = m_pPath[i].y * Const.PANE_HEIGHT + Const.PANE_HEIGHT / 2;
    }

    // 调整路径
    j = 0;
    m = 0;
    while (j < n - 1)
    {
     /*   for (i = n - 1; i > j; i--)
        {
            if (this.CanMove(m_pPath[i], m_pPath[j]))
            {
                j = i;
                m_pPath[m++] = m_pPath[i];
                break;
            }
        }*/
        j = j + 1;
        m_pPath[m++] = m_pPath[j];
    }

    pPath[0] = {}
    pPath[0].pos = startPos;
    pPath[0].fLen = 0.0;

    // 计算路程
    var dx, dy;
    for (i = 0; i < m; i++)
    {
        pPath[i + 1] = {}
        pPath[i + 1].pos = {}
        pPath[i + 1].pos.x = m_pPath[i].x;
        pPath[i + 1].pos.y = m_pPath[i].y;
        dx = pPath[i + 1].pos.x - pPath[i].pos.x;
        dy = pPath[i + 1].pos.y - pPath[i].pos.y;
        pPath[i + 1].fLen = pPath[i].fLen + Math.sqrt(dx * dx + dy * dy);
    }

    // 同一格
    if (this.m_startPos.x == this.m_endPos.x && this.m_startPos.y == this.m_endPos.y)
    {
        pPath[1].pos = endPos;
        dx = pPath[1].pos.x - pPath[0].pos.x;
        dy = pPath[1].pos.y - pPath[0].pos.y;
        pPath[1].fLen = Math.sqrt(dx * dx + dy * dy);
        m = 1;
    }

    return m + 1;
}

// 生成下一步走法，只生成相邻的 8 个位置，走过的位置不再生成
Obstacle.prototype.GenNextPos = function()
{
    var left = 0, right = 0, top = 0, bottom = 0;

    // 删除已走过位置
    this.m_dwNextPosCount--;

    // 已走过位置不能再走
    m_pInfo[m_pNextPosList[this.m_dwNextPosCount].y * this.m_nColumn
        + m_pNextPosList[this.m_dwNextPosCount].x].state = STATE_PASSED;

    // 寻路的范围(以人物当前位置为中心进行确定)
    left   = this.m_startPos.x - SEARCHWIDTH;
    right  = this.m_startPos.x + SEARCHWIDTH;
    top    = this.m_startPos.y - SEARCHHEIGHT;
    bottom = this.m_startPos.y + SEARCHHEIGHT;

    if (left < 0)
    {
        // 在屏幕偏左，调整位置
        left  = 0;
        right = 2 * SEARCHWIDTH;
    }

    if (right >= this.m_nColumn)
    {
        // 在屏幕偏右，调整位置
        left  = this.m_nColumn - 2 * SEARCHWIDTH;
        right = this.m_nColumn - 1;

        // 最后约束左坐标避免超出范围
        if (left < 0)
            left = 0;
    }

    if (top < 0)
    {
        // 在屏幕偏上，调整位置
        top    = 0;
        bottom = 2 * SEARCHHEIGHT;
    }

    if (bottom >= this.m_nRow)
    {
        // 在屏幕偏下，调整位置
        top    = this.m_nRow - 2 * SEARCHHEIGHT;
        bottom = this.m_nRow - 1;

        // 最后约束上坐标避免超出范围
        if (top < 0)
            top = 0;
    }

    var nextPos = {};
    nextPos.x = this.m_curPos.x + 1;
    nextPos.y = this.m_curPos.y;
    if (nextPos.x < right
        && this.m_pGrids[nextPos.y * this.m_nColumn + nextPos.x] == 0
        && m_pInfo[nextPos.y * this.m_nColumn + nextPos.x].state != STATE_PASSED)
        // 右方可走
        this.AddPos(nextPos);

    var nextPos = {};
    nextPos.x = this.m_curPos.x;
    nextPos.y = this.m_curPos.y + 1;
    if (nextPos.y < bottom
        && this.m_pGrids[nextPos.y * this.m_nColumn + nextPos.x] == 0
        && m_pInfo[nextPos.y * this.m_nColumn + nextPos.x].state != STATE_PASSED)
        // 下方可走
        this.AddPos(nextPos);

    var nextPos = {};
    nextPos.x = this.m_curPos.x - 1;
    nextPos.y = this.m_curPos.y;
    if (nextPos.x >= left
        && this.m_pGrids[nextPos.y * this.m_nColumn + nextPos.x] == 0
        && m_pInfo[nextPos.y * this.m_nColumn + nextPos.x].state != STATE_PASSED)
        // 左方可走
        this.AddPos(nextPos);

    var nextPos = {};
    nextPos.x = this.m_curPos.x;
    nextPos.y = this.m_curPos.y - 1;
    if (nextPos.y >= top
        && this.m_pGrids[nextPos.y * this.m_nColumn + nextPos.x] == 0
        && m_pInfo[nextPos.y * this.m_nColumn + nextPos.x].state != STATE_PASSED)
        // 上方可走
        this.AddPos(nextPos);
}

// 判断 pos1 是否可以直接到达 pos2
// 直线上如果没有其它坐标，那么就认为可以直接到达
// pos1、pos2的坐标必须保证正确，即在范围内
Obstacle.prototype.CanMove = function(poss1, poss2)
{
    var dx, dy, delta, i, n;
    var pos;
    var bFlag;
    var bChange;
    var pos1 = {x : poss1.x, y : poss1.y}
    var pos2 = {x : poss2.x, y : poss2.y}

    // pos1 在 pos2 左边
    if (pos1.x > pos2.x)
        pos = pos1, pos1 = pos2, pos2 = pos;

    dx = pos2.x - pos1.x;
    dy = pos2.y - pos1.y;

    // dy 取绝对值
    if (dy < 0)
        dy = -dy, bFlag = TRUE;
    else
        bFlag = FALSE;

    if (dx >= dy)
    {
        delta = n = dx;
        pos = pos1;
        for (i = 0; i <= n; i++)
        {
            // 计算 delta
            if (delta < 0)
            {
                delta += 2 * (dx - dy);
                bChange = TRUE;
            }
            else
            {
                delta -= 2 * dy;
                bChange = FALSE;
            }

            if (bChange)
            {
                // y 改变
                if (!bFlag)
                    pos.y++;
                else
                    pos.y--;
            }

            if (this.InObstacle(pos.x, pos.y)){
                // 有障碍
                return FALSE;
            }

            // 下一个位置
            pos.x++;
        }
    }
    else
    {
        delta = n = dy;
        if (! bFlag)    pos = pos1;
        else            pos = pos2;

        for (i = 0; i <= n; i++)
        {
            // 计算 delta
            if (delta < 0)
            {
                delta += 2 * (dy - dx);
                bChange = TRUE;
            }
            else
            {
                delta -= 2 * dx;
                bChange = FALSE;
            }

            if (bChange)
            {
                // y 改变
                if (! bFlag)
                    pos.x++;
                else
                    pos.x--;
            }

            if (this.InObstacle(pos.x, pos.y)){
                // 有障碍
                return FALSE;
            }

            // 下一个位置
            pos.y ++;
        }
    }

    // 无障碍
    return TRUE;
}

// 将 nextPos 加入位置列表
Obstacle.prototype.AddPos = function(nextPos)
{
    // 计算从 curPos 到 nextPos 的路径信息
    var dx = nextPos.x - this.m_curPos.x;
    var dy = nextPos.y - this.m_curPos.y;
    var fCurValue = m_pInfo[this.m_curPos.y * this.m_nColumn + this.m_curPos.x].fCurValue
        + Math.sqrt(dx * dx + dy * dy);
    var fValue = fCurValue + this.Evaluate(nextPos, this.m_endPos);

    if (fValue < m_pInfo[nextPos.y * this.m_nColumn + nextPos.x].fValue)
    {
        // 从 curPos 到 nextPos 为经过 nextPos 的最短路径
        if (m_pInfo[nextPos.y * this.m_nColumn + nextPos.x].state == STATE_EMPTY)
        {
            // nextPos 未加入位置列表
            m_pInfo[nextPos.y * this.m_nColumn + nextPos.x].state = STATE_ADDED,
            m_pNextPosList[this.m_dwNextPosCount++] = nextPos;

            assert(this.m_dwNextPosCount < MAX_NEXT_POS_COUNT, "this.m_dwNextPosCount >= MAX_NEXT_POS_COUNT");
        }

        // 更新 nextPos 的位置信息
        m_pInfo[nextPos.y * this.m_nColumn + nextPos.x].fCurValue = fCurValue;
        m_pInfo[nextPos.y * this.m_nColumn + nextPos.x].fValue = fValue;
        m_pInfo[nextPos.y * this.m_nColumn + nextPos.x].lastPos = this.m_curPos;
    }
}

// 对下一步的位置排序
Obstacle.prototype.AdjustNextPos = function()
{
    var i;
    var tempPos;

    if (this.m_dwNextPosCount == 0)
    {
        // 没有下一步走法
        return;
    }

    // 最近的走法优先尝试
    for (i = 0; i < this.m_dwNextPosCount - 1; i++)
    {
        if (m_pInfo[m_pNextPosList[i].y * this.m_nColumn + m_pNextPosList[i].x].fValue
            < m_pInfo[m_pNextPosList[i + 1].y * this.m_nColumn + m_pNextPosList[i + 1].x].fValue)
        {
            // 交换
            tempPos = m_pNextPosList[i];
            m_pNextPosList[i] = m_pNextPosList[i + 1];
            m_pNextPosList[i + 1] = tempPos;
        }
    }
}

// 估计 pos1 与 pos2 的最短路径长度
Obstacle.prototype.Evaluate = function(pos1, pos2)
{
    // 理论最短路径
    var dx,dy;
    dx = pos2.x - pos1.x;
    dy = pos2.y - pos1.y;
    return (Math.sqrt(dx * dx + dy * dy));
}

Obstacle.prototype.IsObstacle = function(x, y)
{
    if (x < 0 || y < 0 || x >= this.m_nColumn|| y >= this.m_nRow ){
        return true;
    }

    if (NULL == this.m_pGrids){
        return false;
    }

    return this.m_pGrids[y * this.m_nColumn + x] != 0;
}

Obstacle.prototype.InObstacle = function(x, y)
{
    return this.m_pGrids[Math.floor(y / Const.PANE_HEIGHT) * this.m_nColumn + Math.floor(x / Const.PANE_WIDTH)] != 0;
}

// 获取距离点(x, y)最近的非障碍点(xNew, yNew)
// 成功时返回ture，失败时返回false
// 思路：d从1开始，以1递增，每次检查以下四条线段所经过的位置是否存在非障碍点，如果有则返回true并回传该非障碍点即可
//          线段(x-d, y), (x, y-d)
//          线段(x, y-d), (x+d, y)
//          线段(x+d, y), (x, y+d)
//          线段(x, y+d), (x-d, y)
//       d的最大值为点(x, y)到地图四条边框的距离的最大值
Obstacle.prototype.GetNearestPos = function(x, y)
{
    var xNew = 0, yNew = 0;

    if (NULL == this.m_pGrids)
        return 0;

    if (x < 0 || y < 0 || x >= this.m_nColumn|| y >= this.m_nRow )
    {
        // 超出范围，取中点
        x = this.m_nColumn / 2;
        y = this.m_nRow / 2;
        return 0;
    }

    if (! this.IsObstacle(x, y))
    {
        // 点(x, y)为非障碍点
        xNew = x;
        yNew = y;
        return xNew * 1000 + yNew;
    }

    // 获取搜索的最大距离
    var dMax = x + 1;
    if (dMax < y + 1) dMax = y + 1;
    if (dMax < this.m_nColumn - x) dMax = this.m_nColumn - x;
    if (dMax < this.m_nRow - y) dMax = this.m_nRow - y;

    var d = 1;  // 从距离为1的点开始搜索
    while (d < dMax)
    {
        var i = d;
        while (i > 0)
        {
            xNew = x - i;
            yNew = y - (d - i);

            if (xNew >= 0 && yNew >= 0 && ! this.IsObstacle(xNew, yNew))
                // 点(xNew, yNew)为非障碍点
                return xNew * 1000 + yNew;

            --i;
        }

        while (i < d)
        {
            xNew = x + i;
            yNew = y - (d - i);

            if (xNew < this.m_nColumn && yNew >= 0 && ! this.IsObstacle(xNew, yNew))
                // 点(xNew, yNew)为非障碍点
                return xNew * 1000 + yNew;

            ++i;
        }

        while (i > 0)
        {
            xNew = x + i;
            yNew = y + (d - i);

            if (xNew < this.m_nColumn && yNew < this.m_nRow && ! this.IsObstacle(xNew, yNew))
                // 点(xNew, yNew)为非障碍点
                return xNew * 1000 + yNew;

            --i;
        }

        while (i < d)
        {
            xNew = x - i;
            yNew = y + (d - i);

            if (xNew >= 0 && yNew < this.m_nRow && ! this.IsObstacle(xNew, yNew))
                // 点(xNew, yNew)为非障碍点
                return xNew * 1000 + yNew;

            ++i;
        }

        ++d;
    }

    return 0;
}

Obstacle.prototype.getSceneHeight = function()
{
    if (tmxInfos[this.curMapId])
        return tmxInfos[this.curMapId].contentSize.height;
    else
        return 0
}

module.exports = {
    create : function(client) { return new Obstacle(client); },
}
