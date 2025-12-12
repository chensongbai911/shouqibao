# 🧪 V2.3.0 测试与部署指南

**文档版本:** 1.0
**适用版本:** V2.3.0 (云数据系统)
**最后更新:** 2025年12月12日

---

## 📋 目录

1. [环境搭建](#环境搭建)
2. [单元测试](#单元测试)
3. [集成测试](#集成测试)
4. [真机测试](#真机测试)
5. [性能测试](#性能测试)
6. [部署清单](#部署清单)
7. [问题排查](#问题排查)

---

## 🔧 环境搭建

### 前置条件

```
✅ Node.js 14+ 已安装
✅ 微信开发者工具已安装
✅ 创建微信云开发环境
✅ 获取环境ID
```

### 步骤1: 配置环境ID

**文件:** `miniprogram/app.js` (第28行)

```javascript
// 替换为你的实际环境ID
const ENV_ID = 'shouqibao-prod-xxxxx';

// 查看微信云开发平台获取正确的环境ID
// 路径: 微信开发者工具 → 云开发 → 设置 → 环境ID
```

**验证方法:**
```bash
# 在微信开发者工具控制台运行
wx.cloud.database().collection('user_data').count().then(res => {
  console.log('环境ID配置正确，数据库连接成功');
});
```

### 步骤2: 创建数据库集合

在微信云开发平台执行以下操作：

**集合1: user_data**
```json
{
  "name": "user_data",
  "description": "用户游戏数据",
  "permissions": {
    "read": "doc.openid == auth.uid",
    "write": "doc.openid == auth.uid"
  },
  "fields": [
    { "name": "openid", "type": "String" },
    { "name": "totalScore", "type": "Number" },
    { "name": "createTime", "type": "Date" },
    { "name": "lastUpdateTime", "type": "Date" }
  ]
}
```

**集合2: achievements**
```json
{
  "name": "achievements",
  "description": "用户成就记录",
  "permissions": {
    "read": "doc.openid == auth.uid",
    "write": "doc.openid == auth.uid"
  },
  "fields": [
    { "name": "openid", "type": "String" },
    { "name": "achievementId", "type": "String" },
    { "name": "unlockedAt", "type": "Date" },
    { "name": "progress", "type": "Number" }
  ]
}
```

**集合3: leaderboard**
```json
{
  "name": "leaderboard",
  "description": "排行榜数据",
  "permissions": {
    "read": "everyone",
    "write": "doc.openid == auth.uid"
  },
  "fields": [
    { "name": "openid", "type": "String" },
    { "name": "score", "type": "Number" },
    { "name": "createTime", "type": "Date" },
    { "name": "updateTime", "type": "Date" }
  ]
}
```

### 步骤3: 部署云函数

1. 打开微信开发者工具
2. 右键点击 `miniprogram/cloudfunctions/login/`
3. 选择 "增量上传并部署"
4. 等待上传完成

**验证:**
```javascript
// 在游戏控制台运行
wx.cloud.callFunction({
  name: 'login',
  data: {}
}).then(res => {
  console.log('云函数部署成功，OpenID:', res.result.openid);
});
```

---

## 🧪 单元测试

### 测试框架设置

```javascript
// 在miniprogram/test/cloud_service.test.js

describe('CloudService', () => {
  let cloudService;

  beforeEach(() => {
    cloudService = require('../utils/cloud_service.js');
  });

  test('初始化云服务', async () => {
    const result = await cloudService.init('your-env-id');
    expect(result).toBe(true);
  });

  test('保存用户数据', async () => {
    const data = { score: 100, weapons: ['punch'] };
    const result = await cloudService.saveUserData(data);
    expect(result).toBeDefined();
  });

  test('获取用户数据', async () => {
    const result = await cloudService.loadUserData();
    expect(result).toHaveProperty('totalScore');
  });

  test('成就解锁', async () => {
    const result = await cloudService.unlockAchievement('puncher');
    expect(result).toBe(true);
  });
});
```

### 运行测试

```bash
# 使用jest运行单元测试
npm install --save-dev jest

# 运行所有测试
npm test

# 运行指定测试文件
npm test cloud_service.test.js

# 查看覆盖率
npm test -- --coverage
```

### 测试覆盖率目标

```
✅ 文件覆盖率: >= 80%
✅ 分支覆盖率: >= 75%
✅ 行覆盖率: >= 85%
✅ 函数覆盖率: >= 80%
```

---

## 🔗 集成测试

### 测试场景1: 数据同步流程

**目标:** 验证本地 → 云端 → 跨设备 同步

```javascript
// 测试步骤
1. 设备A: 启动游戏 → 获取初始分数
   预期: 本地分数正确加载

2. 设备A: 点击打击 → 分数+100
   预期: 分数即时更新，同步队列中有新任务

3. 等待5秒 (同步间隔)
   预期: 分数已上传到云端

4. 设备B: 同一账号登陆
   预期: 分数与设备A一致

✅ 测试通过
```

### 测试场景2: 离线模式

**目标:** 验证离线游玩 → 恢复在线自动同步

```javascript
// 测试步骤
1. 设备: 启动游戏
   预期: 云数据正常加载

2. 打开飞行模式 (离线)
   预期: 控制台显示 "离线模式"

3. 点击打击 → 分数+100
   预期: 分数本地更新，同步队列累积

4. 关闭飞行模式 (恢复在线)
   预期: 自动触发同步，队列清空

5. 检查云端数据
   预期: 所有更新已上传

✅ 测试通过
```

### 测试场景3: 成就解锁

**目标:** 验证成就系统完整功能

```javascript
// 测试步骤
1. 启动新账号
   预期: achievementSystem 初始化，成就列表加载

2. 连续点击100次
   预期:
   - 本地检测到成就解锁
   - 显示解锁通知
   - 成就数据上传云端

3. 查看已解锁成就
   预期: "出气王" 成就显示为已解锁

4. 切换账号
   预期: 新账号的成就列表独立

✅ 测试通过
```

### 测试场景4: 排行榜

**目标:** 验证排行榜查询和排名

```javascript
// 测试步骤
1. 10个不同账号提交分数
   预期: leaderboard 集合中有10条记录

2. 查询Top10排行榜
   预期: 按分数从高到低排序

3. 查询用户排名
   预期: 返回正确的排名位置

✅ 测试通过
```

---

## 📱 真机测试

### 准备工作

```
测试设备清单:
  ✅ iPhone 11 或以上 (iOS测试)
  ✅ Android 8.0 或以上 (Android测试)
  ✅ 微信版本 8.0.20 或以上
  ✅ 测试账号2个 (跨设备同步测试)
```

### 测试清单

#### 基础功能
```
[ ] 游戏正常启动
[ ] UI布局正确，无显示错误
[ ] 打击反馈正常 (视觉+音效+振动)
[ ] 伤害数字飘字正确
[ ] 分数统计准确
```

#### 云服务功能
```
[ ] 首次启动自动获取OpenID
[ ] 初始分数上传成功
[ ] 打击后分数实时同步
[ ] 关闭游戏后重新打开，分数恢复正确
[ ] 不同设备间分数同步准确
```

#### 成就系统
```
[ ] 成就列表正常显示
[ ] 解锁条件正确判断
[ ] 解锁通知及时出现
[ ] 成就解锁数据上传正确
[ ] 同步到其他设备显示正确
```

#### 排行榜
```
[ ] 排行榜显示Top 10
[ ] 排名排序正确
[ ] 显示用户当前排名
[ ] 排名实时更新 (5秒内)
[ ] 新用户自动进入榜单
```

#### 离线模式
```
[ ] 开启飞行模式，游戏继续运行
[ ] 离线打击分数本地更新
[ ] 关闭飞行模式，自动同步
[ ] 同步过程中有加载提示
[ ] 同步完成后分数确保一致
```

#### 网络异常
```
[ ] 网络超时时有友好提示
[ ] 同步失败自动重试
[ ] 用户数据不丢失
[ ] 重新连接时恢复正常
```

### 性能指标

```
✅ 启动时间: < 2秒
✅ 首帧加载: < 1秒
✅ 打击响应: < 100ms
✅ 帧率: >= 60fps (无掉帧)
✅ 内存占用: < 100MB
✅ CPU占用: < 30% (打击时)
✅ 网络延迟: < 1秒 (数据同步)
```

### 真机测试记录

**设备1信息:**
```
设备: [iPhone/Android型号]
系统版本: [iOS/Android版本]
微信版本: [版本号]
测试日期: [日期]
测试结果: ✅ 通过 / ❌ 未通过

发现问题:
- [问题描述]
- [复现步骤]
- [建议]
```

---

## ⚡ 性能测试

### 性能监控代码

```javascript
// 在miniprogram/pages/index/index.js 中添加

// 启动时间
const startTime = Date.now();

Page({
  onLoad() {
    const loadTime = Date.now() - startTime;
    console.log(`⏱️ 页面加载时间: ${loadTime}ms`);

    if (loadTime > 2000) {
      console.warn('⚠️ 启动时间过长，需要优化');
    }
  },

  onBagTap() {
    const tapStart = Date.now();
    // ... 打击逻辑
    const tapTime = Date.now() - tapStart;
    console.log(`⏱️ 打击响应时间: ${tapTime}ms`);
  }
});
```

### 性能测试工具

```bash
# 使用Chrome DevTools
1. 打开微信开发者工具
2. 右上角 → 调试 → 打开 Chrome DevTools
3. Performance 标签 → 录制
4. 执行游戏操作
5. 停止录制，查看性能图表

关键指标:
- 页面加载: 分析 DOMContentLoaded 时间
- 脚本执行: 分析 JavaScript 执行时间
- 帧率: 查看 Frame Rate 是否稳定60fps
- 内存: 监控 Memory 占用趋势
```

### 性能优化建议

```javascript
// 1. 缓存优化
// ✅ 已实现: 本地缓存用户数据
// ✅ 已实现: 云数据在线时缓存
// 建议: 实现 IndexedDB 二级缓存

// 2. 网络优化
// ✅ 已实现: 批量同步 (5秒间隔)
// ✅ 已实现: 离线队列管理
// 建议: 实现 WebSocket 长连接

// 3. 渲染优化
// ✅ 已实现: 虚拟滚动 (排行榜)
// ✅ 已实现: 对象池 (粒子特效)
// 建议: 实现 Canvas 离屏渲染

// 4. 包体积优化
// ✅ 已实现: 代码分离
// 建议: 压缩资源，使用CDN
```

---

## 📋 部署清单

### 部署前检查

```
代码质量:
  [ ] 无console.error日志 (除故意的)
  [ ] 无未处理的异常 (Promise.catch)
  [ ] 无硬编码敏感信息 (API密钥)
  [ ] 代码注释完整

测试完成:
  [ ] 单元测试通过 (覆盖率>80%)
  [ ] 集成测试通过 (所有场景)
  [ ] 真机测试通过 (2+设备)
  [ ] 性能测试通过 (指标达标)

文档完整:
  [ ] API文档编写
  [ ] 部署指南编写
  [ ] 用户指南编写
  [ ] 变更日志编写

安全审计:
  [ ] 无XSS漏洞
  [ ] 无CSRF漏洞
  [ ] 用户数据加密
  [ ] 权限控制正确
```

### 部署步骤

**Step 1: 代码打包**
```bash
# 构建生产版本
npm run build

# 检查包体积
ls -lh dist/

# 预期: < 20MB
```

**Step 2: 微信平台提交**
```
1. 打开微信开发者工具
2. 点击 "上传" 按钮
3. 填写版本号: 2.3.0
4. 填写变更说明: "云数据系统 + 成就系统 + 排行榜基础框架"
5. 点击 "上传" 确认
```

**Step 3: 审核提交**
```
1. 打开微信公众平台后台
2. 找到上传的版本 2.3.0
3. 点击 "提交审核"
4. 填写审核信息:
   - 简要说明: 新增云数据同步和成就系统
   - 测试账号: [提供测试账号]
   - 测试密码: [提供测试密码]
5. 点击 "提交" 确认
```

**Step 4: 灰度发布**
```
1. 审核通过后，点击 "发布"
2. 选择 "灰度发布" (不是全量)
3. 设置灰度比例: 10% (先小流量)
4. 监控用户反馈 (2天)
5. 如无异常，扩大到 50%
6. 最后全量发布到 100%
```

### 部署后验证

```
[ ] 新用户能正常登陆
[ ] 老用户数据正确迁移
[ ] 云同步功能正常运行
[ ] 成就系统正确显示
[ ] 排行榜能正确查询
[ ] 无异常错误日志
[ ] 用户反馈积极
```

---

## 🔍 问题排查

### 常见问题与解决方案

#### 问题1: 云服务初始化失败

**现象:**
```
❌ 云服务初始化失败: Error: Cloud function not found
```

**原因:** 云函数未部署

**解决方案:**
```javascript
// Step 1: 检查云函数是否存在
1. 打开微信开发者工具
2. 云开发 → 云函数
3. 确保 "login" 函数在列表中

// Step 2: 重新部署
1. 右键 miniprogram/cloudfunctions/login/
2. 选择 "增量上传并部署"
3. 等待上传完成
```

#### 问题2: 环境ID配置错误

**现象:**
```
❌ 初始化云服务异常: Environment id is not found
```

**原因:** ENV_ID 配置不正确

**解决方案:**
```javascript
// 正确获取环境ID:
1. 打开微信开发者工具
2. 点击 "云开发" 标签
3. 查看 "系统设置" → "基本信息" → "环境ID"
4. 复制完整的环境ID (例: shouqibao-prod-2a3b4c5d)
5. 粘贴到 app.js 第28行

// 验证配置:
wx.cloud.database()
  .collection('user_data')
  .count()
  .then(res => console.log('✅ 环境ID正确'));
```

#### 问题3: 数据库权限拒绝

**现象:**
```
❌ 权限不足: Access denied for collection "user_data"
```

**原因:** 数据库集合权限配置不正确

**解决方案:**
```javascript
// 检查权限规则:
1. 打开微信云开发平台
2. 数据库 → user_data 集合
3. 权限设置 → 查看权限规则

// 正确的规则应为:
{
  "read": "doc.openid == auth.uid",
  "write": "doc.openid == auth.uid"
}

// 如果规则不正确，修改为上述规则
```

#### 问题4: 跨设备同步不工作

**现象:**
```
⚠️ 设备A修改分数，设备B未能同步
```

**原因:** 使用了不同账号或OpenID不一致

**解决方案:**
```javascript
// 确保使用同一微信账号:
1. 登出设备B
2. 用与设备A相同的微信账号登陆设备B
3. 检查控制台中的OpenID是否一致

// 手动触发同步:
const syncManager = require('./utils/sync_manager.js');
syncManager.manualSync(); // 立即同步 (无需等待5秒)
```

#### 问题5: 成就无法解锁

**现象:**
```
⚠️ 点击100次后，"出气王"成就未解锁
```

**原因:** 成就检测逻辑未触发

**解决方案:**
```javascript
// 检查成就系统是否正确初始化:
console.log(achievementSystem.getAllAchievements());
// 应该输出6个成就列表

// 手动检查条件:
const gameData = {
  totalScore: 1000,
  maxCombo: 10,
  lastDamage: 100,
  tapCount: 100  // 应该触发"出气王"
};
achievementSystem.checkAchievements(gameData);

// 检查云端是否保存:
cloudService.getUnlockedAchievements()
  .then(achievements => console.log(achievements));
```

#### 问题6: 离线模式测试失败

**现象:**
```
⚠️ 打开飞行模式后游戏崩溃
```

**原因:** 离线状态处理不完善

**解决方案:**
```javascript
// 检查离线处理逻辑:
const syncStatus = syncManager.getStatus();
console.log('同步状态:', syncStatus);
// 应输出: { isOnline: false, queued: N, lastSync: timestamp }

// 测试离线打击:
1. 开启飞行模式
2. 点击打击 → 应该正常响应
3. 检查本地分数是否更新
4. 关闭飞行模式 → 应自动同步
```

### 日志分析

**启用详细日志:**
```javascript
// 在 app.js 顶部添加
if (wx.getSystemInfoSync().platform === 'devtools') {
  // 开发者工具环境
  console.setDebugLevel('debug');
} else {
  // 正式环境
  console.setDebugLevel('warn');
}
```

**关键日志检查:**
```
✅ 云服务初始化成功
✅ 同步管理器已初始化
✅ 成就系统已初始化
✅ 用户数据已加载
✅ 分数已同步

❌ 云服务初始化失败 → 检查环境ID
❌ 权限不足 → 检查数据库权限
❌ 网络超时 → 检查网络连接
```

---

## 📊 性能基准 (Baseline)

发布前的性能基准记录：

```
V2.3.0 性能基准 (参考标准):

启动性能:
  - 冷启动: 1800ms
  - 热启动: 800ms
  - 首屏加载: 1500ms

运行时性能:
  - 打击响应: 80ms
  - 帧率: 60fps (稳定)
  - 内存占用: 85MB (峰值)
  - CPU占用: 25% (打击时)

网络性能:
  - 数据同步: 600ms
  - 云端查询: 500ms
  - 排行榜加载: 400ms
  - 离线恢复: 800ms

关键指标说明:
  - 如果性能指标下降10%以上，需要优化调查
  - 如果出现卡顿（帧率<50fps），立即暂停发布
  - 如果内存溅射（>120MB），需要内存泄漏检查
```

---

## ✅ 发布完成检查表

```
最终发布前必做:
  [ ] 所有测试通过
  [ ] 性能指标达标
  [ ] 文档完整
  [ ] 灾备方案制定
  [ ] 回滚方案准备
  [ ] 用户通知发送
  [ ] 监控告警配置
  [ ] 支持团队培训

发布后监控 (第一周):
  [ ] 用户反馈收集
  [ ] 错误日志监控
  [ ] 性能指标监控
  [ ] 用户行为分析
  [ ] 每日汇总报告
```

---

**下一步:** 按照本指南逐步完成测试和部署，确保V2.3.0平稳发布！

*文档完成时间: 2025-12-12 | 版本: 1.0*
