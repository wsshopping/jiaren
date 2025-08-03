# CLAUDE.md

这个文件为 Claude Code (claude.ai/code) 提供在此代码库中工作的指导。

## 项目概述

这是一个**游戏自动化测试框架**，专为MMO游戏服务器的负载测试和功能测试而设计。该系统模拟多个游戏客户端来测试服务器容量、性能和游戏机制。

## 架构

### 核心组件

- **main.js**: 入口点，初始化系统并提供Web界面
- **client.js**: 游戏客户端模拟引擎，包含连接管理
- **me.js**: 玩家角色模拟，包含游戏状态管理
- **mgr.js**: 共享工具和NPC/地图数据管理
- **cfg.js**: 使用lowdb的中央配置系统

### 通信层 (`/comm/`)
- **Comm.js**: 消息处理系统
- **Connection.js**: 网络连接管理
- **MsgParser.js**: 游戏协议消息解析
- **DataStream.js**: 游戏协议的二进制数据处理
- **Fields.js**: 协议字段定义
- **Utils.js**: 通信工具

### 游戏系统
- **AutoWalk.js**: 自动移动系统
- **Obstacle.js**: 寻路和碰撞检测
- **Instruction.js**: 游戏指令处理
- **MapInfo.js**: 游戏世界地图数据
- **Const.js**: 游戏常量和枚举

## 关键命令

### 开发命令
```bash
# 启动应用程序
node main.js

# 使用自定义配置启动
node main.js [前缀] [位数] [起始] [结束] [密码]

# 访问Web界面
http://localhost:3000/home
http://localhost:3000/config
```

### API端点
- `GET /api/checkConnections` - 获取连接状态
- `POST /api/createLoginAllClinetNum` - 创建并登录多个客户端
- `POST /api/loginListClient` - 登录特定账户
- `GET /api/getConfig` - 获取配置
- `POST /api/updateConfig` - 更新配置

### 配置系统
- 使用`lowdb`和JSON文件存储在`/config/config.json`
- 环境变量覆盖默认值
- Web界面实时配置更新

### 客户端管理
- **批量操作**: `createLoginAllClinetNum(num)` 创建并登录N个客户端
- **单独控制**: `createLoginClinet(account)` 用于单个账户
- **连接监控**: 内置连接状态跟踪

## 测试功能

### 负载测试
- 模拟数百个并发游戏客户端
- 跟踪连接统计（AAA、GS、丢失连接）
- 可配置的客户端创建模式

### 功能测试
- 使用随机名称自动创建角色
- 带有寻路的移动模拟
- 交易系统测试（摊位、拍卖）
- 战斗系统模拟
- 组队形成和匹配

### 监控
- Web仪表板实时监控
- 连接状态跟踪
- 性能指标收集

## 配置文件

- **config/config.json**: 主配置（自动生成）
- **cfg.js**: 默认配置值
- **trading_cfg.js**: 交易系统测试订单
- **name files**: 角色名称字典

## 安全说明

此系统专为**受控环境中的合法服务器测试**而设计。所有连接使用标准游戏协议和适当身份验证。该框架包括反机器人检测处理并尊重服务器速率限制。

## 环境变量

```bash
SERVER_PORT=3001     # 游戏服务器端口
HTTP_PORT=3000       # Web界面端口
USERS_PREFIX=s2      # 账户前缀
USERS_INDEX_NUM=4    # 账户数字填充
USERS_START=1        # 起始账户编号
USERS_END=1          # 结束账户编号
USERS_PASS=123456    # 默认密码
```

## 文件结构

```
├── main.js              # 入口点
├── client.js            # 客户端模拟
├── me.js                # 玩家模拟
├── mgr.js               # 工具
├── cfg.js               # 配置
├── config/              # 配置文件
├── comm/                # 通信层
├── lib/                 # 工具（DES、日志）
├── utils/               # 数据管理
├── views/               # Web界面模板
├── public/              # 静态web资产
├── tmx/                 # 地图数据文件
└── *.json               # 游戏数据文件
```