# 🔧 V2.3.0 技术参考指南

**参考文档:** 微信云开发集成指南
**更新日期:** 2025年12月12日
**难度:** ⭐⭐⭐ (中等)

---

## 📚 快速导航

| 主题 | 链接 | 时间 |
|------|------|------|
| 微信云开发文档 | https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html | 必读 |
| 云函数API | https://developers.weixin.qq.com/miniprogram/dev/wxcloud/api-index.html | 参考 |
| 数据库查询 | https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/database.html | 重要 |
| 安全规则 | https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/database/security.html | 必读 |

---

## 💡 核心概念速查

### 概念1: 环境 (Environment)
```
微信云: 隔离的云环境
作用: 数据库、云函数、文件存储独立
配置: 在微信平台创建，获得环境ID

示例:
  生产环境ID: prod-xxx-abc123
  测试环境ID: test-xxx-def456
```

### 概念2: OpenID (用户标识)
```
微信: 自动为每个用户生成的唯一标识
作用: 标识不同用户，隔离用户数据
获取: wx.cloud.auth().getUSerInfo()

示例:
  用户A OpenID: oFAI...xyz123
  用户B OpenID: oJKL...abc456
```

### 概念3: 云函数 (函数式API)
```
微信云: 运行在服务器的代码
作用: 处理复杂业务逻辑，避免暴露密钥
语言: Node.js

示例:
  calcRank() - 计算用户排名
  addAchievement() - 解锁成就
```

### 概念4: 数据库集合 (Collection)
```
MongoDB: 类似表的数据结构
作用: 存储结构化数据
字段: 类似列，支持多种类型

示例:
  user_data 集合:
    ├─ _id: 文档ID (自动)
    ├─ userId: 用户ID
    ├─ score: 分数
    └─ updateTime: 更新时间
```

---

## 🔐 安全规则详解

### 规则1: 用户只能访问自己的数据

```javascript
// 权限规则 (在微信云平台配置)
{
  "read": "doc.userId == auth.uid",
  "write": "doc.userId == auth.uid"
}

解释:
  doc.userId: 数据库中存储的用户ID
  auth.uid: 当前登录用户的ID
  ==: 只有相等才允许

效果:
  用户A只能读/写自己的数据 ✓
  用户A不能读/写用户B的数据 ✗
```

### 规则2: 排行榜允许所有人读，仅自己写

```javascript
{
  "read": "true",  // 所有人可读
  "write": "doc.userId == auth.uid"  // 仅本人可写
}

效果:
  所有玩家都能看排行榜 ✓
  但只能修改自己的排名 ✓
  不能篡改他人排名 ✗
```

---

## 📝 API速查表

### 初始化云环境

**文件:** `app.js`

```javascript
// 在App的onLaunch中执行
onLaunch() {
  // 初始化云开发
  wx.cloud.init({
    env: 'shouqibao-prod-xxxxxx',  // 替换为你的环境ID
    traceUser: true
  });
}
```

### 获取用户OpenID

```javascript
// 在需要认证的地方调用
wx.cloud.callFunction({
  name: 'login',  // 云函数名
  data: {},
  success: res => {
    console.log('用户OpenID:', res.result.openid);
    // 保存到本地
    wx.setStorageSync('userId', res.result.openid);
  }
});
```

### 保存数据到数据库

```javascript
const db = wx.cloud.database();

// 新增记录
db.collection('user_data').add({
  data: {
    userId: 'oFAI...xyz123',
    totalScore: 1000,
    lastUpdateTime: new Date()
  },
  success: res => {
    console.log('数据保存成功:', res._id);
  }
});
```

### 查询数据

```javascript
const db = wx.cloud.database();

// 查询单个用户的数据
db.collection('user_data')
  .where({
    userId: 'oFAI...xyz123'
  })
  .get({
    success: res => {
      console.log('查询结果:', res.data);
    }
  });
```

### 更新数据

```javascript
const db = wx.cloud.database();

// 更新指定记录
db.collection('user_data').doc('_id_value').update({
  data: {
    totalScore: 2000,
    lastUpdateTime: new Date()
  },
  success: res => {
    console.log('更新成功');
  }
});
```

### 删除数据

```javascript
const db = wx.cloud.database();

// 删除指定记录
db.collection('user_data').doc('_id_value').remove({
  success: res => {
    console.log('删除成功');
  }
});
```

---

## 🎯 实现步骤详解

### 步骤1: 初始化 (15分钟)

**文件:** `miniprogram/app.js`

```javascript
// 找到 onLaunch 方法，添加以下代码

App({
  onLaunch: function () {
    // 初始化云开发
    wx.cloud.init({
      env: '你的环境ID', // 替换为实际环境ID
      traceUser: true
    });

    // 获取用户信息 (自动)
    this.getUserOpenId();
  },

  // 获取用户OpenID
  getUserOpenId() {
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        this.globalData.userId = res.result.openid;
        wx.setStorageSync('userId', res.result.openid);
      },
      fail: err => {
        console.error('获取OpenID失败:', err);
      }
    });
  },

  globalData: {
    userId: null
  }
});
```

### 步骤2: 创建云服务 (2小时)

**文件:** `miniprogram/utils/cloud_service.js` (新建)

```javascript
/**
 * 云服务封装
 * 统一管理所有云数据库操作
 */

class CloudService {
  constructor() {
    this.db = wx.cloud.database();
    this.userId = wx.getStorageSync('userId');
  }

  /**
   * 保存用户数据
   */
  saveUserData(data) {
    return new Promise((resolve, reject) => {
      this.db.collection('user_data')
        .where({ userId: this.userId })
        .get({
          success: res => {
            if (res.data.length > 0) {
              // 更新现有记录
              this.db.collection('user_data').doc(res.data[0]._id).update({
                data: {
                  ...data,
                  lastUpdateTime: new Date()
                },
                success: resolve,
                fail: reject
              });
            } else {
              // 新增记录
              this.db.collection('user_data').add({
                data: {
                  userId: this.userId,
                  ...data,
                  createTime: new Date(),
                  lastUpdateTime: new Date()
                },
                success: resolve,
                fail: reject
              });
            }
          },
          fail: reject
        });
    });
  }

  /**
   * 加载用户数据
   */
  loadUserData() {
    return new Promise((resolve, reject) => {
      this.db.collection('user_data')
        .where({ userId: this.userId })
        .get({
          success: res => {
            resolve(res.data[0] || null);
          },
          fail: reject
        });
    });
  }

  /**
   * 更新分数
   */
  updateScore(newScore) {
    return this.saveUserData({
      totalScore: newScore,
      lastUpdateTime: new Date()
    });
  }

  /**
   * 解锁成就
   */
  unlockAchievement(achievementId) {
    return new Promise((resolve, reject) => {
      this.db.collection('achievements').add({
        data: {
          userId: this.userId,
          achievementId: achievementId,
          unlockedAt: new Date()
        },
        success: resolve,
        fail: reject
      });
    });
  }

  /**
   * 查询排行榜 (前100)
   */
  getLeaderboard(limit = 100) {
    return new Promise((resolve, reject) => {
      this.db.collection('leaderboard')
        .orderBy('score', 'desc')
        .limit(limit)
        .get({
          success: res => {
            resolve(res.data);
          },
          fail: reject
        });
    });
  }
}

// 导出单例
const cloudService = new CloudService();
module.exports = cloudService;
```

### 步骤3: 创建同步管理器 (1.5小时)

**文件:** `miniprogram/utils/sync_manager.js` (新建)

```javascript
/**
 * 数据同步管理器
 * 处理本地缓存、网络状态、数据同步
 */

const cloudService = require('./cloud_service.js');

class SyncManager {
  constructor() {
    this.syncQueue = [];  // 待同步队列
    this.isOnline = true;
    this.lastSyncTime = 0;
    this.syncInterval = 10000;  // 10秒同步一次

    this.initNetworkListener();
  }

  /**
   * 监听网络状态
   */
  initNetworkListener() {
    wx.onNetworkStatusChange(res => {
      this.isOnline = res.isConnected;

      if (this.isOnline) {
        console.log('网络恢复，开始同步');
        this.syncAll();
      } else {
        console.log('网络断开，使用离线模式');
      }
    });
  }

  /**
   * 保存分数 (同时支持离线)
   */
  saveScore(score) {
    // 先保存到本地缓存
    const cache = {
      score: score,
      timestamp: Date.now()
    };
    wx.setStorageSync('lastScore', cache);

    // 如果在线，立即同步到云端
    if (this.isOnline) {
      return cloudService.updateScore(score);
    } else {
      // 离线状态，加入队列
      this.syncQueue.push({
        type: 'updateScore',
        data: score
      });
    }
  }

  /**
   * 同步所有待处理项
   */
  syncAll() {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    // 处理队列中的所有项
    this.syncQueue.forEach(item => {
      if (item.type === 'updateScore') {
        cloudService.updateScore(item.data);
      }
    });

    // 清空队列
    this.syncQueue = [];
    this.lastSyncTime = Date.now();
  }
}

// 导出单例
const syncManager = new SyncManager();
module.exports = syncManager;
```

### 步骤4: 集成到游戏 (1小时)

**修改文件:** `miniprogram/pages/index/index.js`

```javascript
// 在文件顶部导入
const cloudService = require('../../utils/cloud_service.js');
const syncManager = require('../../utils/sync_manager.js');

// 在 onBagTap 方法中 (打一次的地方)
onBagTap() {
  // ... 现有代码 ...

  this.setData({ totalScore: newScore });

  // 新增: 保存到云端
  syncManager.saveScore(newScore);  // 这行代码
},

// 在 onLoad 方法中添加加载逻辑
onLoad() {
  // ... 现有代码 ...

  // 新增: 从云端加载用户数据
  cloudService.loadUserData().then(userData => {
    if (userData) {
      this.setData({
        totalScore: userData.totalScore || 0
      });
    }
  });
}
```

---

## 🧪 测试用例

### 测试1: 云端连接
```
步骤:
  1. 打开微信开发者工具
  2. 开启调试模式
  3. 运行小程序

预期结果:
  ✓ 控制台有 "网络状态: 已连接"
  ✓ 看到 "用户OpenID: oFAI...xyz"
```

### 测试2: 数据保存
```
步骤:
  1. 打一次出气包 (得10分)
  2. 查看微信云平台 → 数据库 → user_data

预期结果:
  ✓ 看到新增一条记录
  ✓ totalScore 字段值为 10
  ✓ userId 字段有值
```

### 测试3: 数据加载
```
步骤:
  1. 重新启动小程序
  2. 观察分数显示

预期结果:
  ✓ 分数恢复到上次保存的值
  ✓ 没有出现数据丢失
```

### 测试4: 离线测试
```
步骤:
  1. 打开小程序
  2. 打一次出气包 (记录分数)
  3. 关闭网络 (飞行模式)
  4. 再打一次
  5. 恢复网络

预期结果:
  ✓ 离线状态仍能游玩
  ✓ 分数能正常增加
  ✓ 恢复网络后自动同步
```

---

## 🐛 常见错误排查

### 错误1: "环境ID无效"

**症状:** 初始化失败，无法连接云开发

**排查步骤:**
```
1. 检查环境ID是否正确
   console.log(env ID)

2. 确认该环境在微信平台存在
   微信平台 → 云开发 → 环境管理

3. 尝试重新创建环境
   删除旧的环境，新建一个
```

### 错误2: "权限不足"

**症状:** 查询或保存数据失败，提示权限问题

**排查步骤:**
```
1. 检查安全规则
   微信平台 → 数据库 → 权限

2. 确认规则中有 auth.uid
   (如没有，改为 "read": "true")

3. 重新加载小程序
```

### 错误3: "数据未保存"

**症状:** 数据保存没有错误，但查询看不到

**排查步骤:**
```
1. 检查userId是否正确
   console.log('userId:', wx.cloud.auth().getUSerInfo().openid)

2. 在微信平台手动查询
   选中collection → 输入查询条件

3. 检查数据库权限规则
```

---

## 📊 性能优化建议

### 优化1: 缓存策略

```javascript
// 本地缓存用户数据，减少云查询
const cache = wx.getStorageSync('userData');
if (cache && Date.now() - cache.timestamp < 60000) {
  // 缓存未过期，使用缓存数据
  return cache.data;
} else {
  // 缓存已过期，从云查询
  return cloudService.loadUserData();
}
```

### 优化2: 批量操作

```javascript
// 错误: 循环中频繁调用 (每次都上传)
for (let i = 0; i < achievements.length; i++) {
  cloudService.unlockAchievement(achievements[i]); // ❌ 多次网络请求
}

// 正确: 合并后一次上传
const data = achievements.map(id => ({
  userId: this.userId,
  achievementId: id
}));
db.collection('achievements').add({ data }); // ✓ 一次网络请求
```

### 优化3: 延迟同步

```javascript
// 合并多个更新，每10秒才同步一次
let pendingUpdates = null;
let syncTimer = null;

function scheduleSync(data) {
  pendingUpdates = { ...pendingUpdates, ...data };

  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    cloudService.saveUserData(pendingUpdates);
    pendingUpdates = null;
  }, 10000);
}
```

---

## 💾 数据备份和恢复

### 备份步骤

```javascript
// 定期备份重要数据到本地
function backupData() {
  cloudService.loadUserData().then(data => {
    // 保存3个历史版本
    const versions = wx.getStorageSync('backupVersions') || [];
    versions.unshift({
      data: data,
      timestamp: Date.now()
    });

    // 只保留最新3个
    if (versions.length > 3) {
      versions.pop();
    }

    wx.setStorageSync('backupVersions', versions);
  });
}
```

### 恢复步骤

```javascript
// 从本地备份恢复
function recoverFromBackup(versionIndex = 0) {
  const versions = wx.getStorageSync('backupVersions') || [];
  if (versions[versionIndex]) {
    cloudService.saveUserData(versions[versionIndex].data);
  }
}
```

---

## 🎓 进阶主题

### 主题1: 云函数实现复杂逻辑

**使用场景:** 需要在服务器计算排名

```javascript
// 1. 在微信平台创建云函数 "calculateRank"
// 2. 从小程序调用

wx.cloud.callFunction({
  name: 'calculateRank',
  data: {
    userId: 'oFAI...xyz123',
    score: 1000
  },
  success: res => {
    console.log('你的排名:', res.result.rank);
  }
});
```

### 主题2: 事务处理

```javascript
// 原子性操作: 同时更新多个集合
const db = wx.cloud.database();
const _ = db.command;

// 例如: 解锁武器时既要更新用户数据又要更新统计

// 方法1: 使用云函数 (最安全)
// 方法2: 分别更新，如果失败则回滚
```

### 主题3: 索引优化

```javascript
// 在微信平台数据库管理中添加索引
// 对频繁查询的字段添加索引可以大幅提升查询速度

// 建议索引:
userId → 用户数据查询
score → 排行榜排序查询
achievementId → 成就查询
```

---

**一切都已准备好！** ✅

需要帮助? 查看本文档的相应章节或提问!
