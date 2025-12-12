# 🛠️ V2.3.0 故障排查与性能优化手册

**版本:** 1.0
**适用于:** V2.3.0+ 生产环境
**最后更新:** 2025年12月12日

---

## 📚 快速导航

| 问题类型 | 查看位置 | 解决时间 |
|---------|--------|--------|
| 云服务连接问题 | [第1章](#1-云服务连接问题) | 5分钟 |
| 数据同步异常 | [第2章](#2-数据同步异常) | 10分钟 |
| 成就系统故障 | [第3章](#3-成就系统故障) | 10分钟 |
| 性能瓶颈 | [第4章](#4-性能瓶颈分析) | 20分钟 |
| 网络异常处理 | [第5章](#5-网络异常处理) | 15分钟 |

---

## 1️⃣ 云服务连接问题

### 问题1.1: 初始化连接失败

**症状:**
```
控制台显示: ❌ 云服务初始化失败
用户现象: 游戏无法保存数据
```

**诊断步骤:**

```javascript
// Step 1: 检查wx.cloud是否可用
if (!wx.cloud) {
  console.error('❌ wx.cloud不可用');
  console.log('检查项:');
  console.log('  1. 微信版本是否8.0.20+');
  console.log('  2. 基础库版本是否2.2.3+');
}

// Step 2: 测试环境ID
wx.cloud.init({ env: 'YOUR_ENV_ID' });
wx.cloud.database()
  .collection('user_data')
  .count()
  .then(res => {
    console.log('✅ 环境ID正确，连接成功');
    console.log('数据库记录数:', res.total);
  })
  .catch(err => {
    console.error('❌ 连接失败:', err.message);
    console.log('可能原因:');
    console.log('  1. 环境ID错误');
    console.log('  2. 网络连接失败');
    console.log('  3. 云开发环境已过期');
  });

// Step 3: 检查网络
wx.getNetworkType({
  success: res => {
    console.log('当前网络:', res.networkType);
    if (res.networkType === 'none') {
      console.warn('⚠️ 无网络连接');
    }
  }
});
```

**解决方案:**

| 错误信息 | 原因 | 解决方法 |
|---------|------|--------|
| `Environment id not found` | 环境ID为空 | 检查app.js第28行的ENV_ID配置 |
| `Invalid environment` | 环境不存在 | 在微信平台验证环境ID是否有效 |
| `Network error` | 网络连接失败 | 检查设备网络，重试连接 |
| `Permission denied` | 权限不足 | 检查cloud数据库权限配置 |

**最常见原因 - 环境ID错误:**
```javascript
❌ 错误配置:
const ENV_ID = 'shouqibao-prod-xxxxx';  // 使用占位符

✅ 正确配置:
const ENV_ID = 'shouqibao-prod-2a3b4c5d';  // 实际的环境ID

// 如何获取正确的环境ID:
// 1. 打开微信开发者工具
// 2. 点击"云开发"标签
// 3. 在右上角看到完整的环境ID
// 4. 复制并粘贴到app.js中
```

---

### 问题1.2: OpenID获取失败

**症状:**
```
控制台显示: ❌ 获取OpenID失败
用户现象: 用户数据无法关联
```

**诊断代码:**

```javascript
// 检查云函数是否部署
wx.cloud.callFunction({
  name: 'login',
  data: {}
})
.then(res => {
  console.log('✅ 云函数正常，OpenID:', res.result.openid);
})
.catch(err => {
  console.error('❌ 云函数调用失败:', err.errMsg);

  if (err.errMsg.includes('not found')) {
    console.log('❌ 云函数未部署');
    console.log('解决: 右键miniprogram/cloudfunctions/login/，选择增量上传');
  } else if (err.errMsg.includes('timeout')) {
    console.log('❌ 网络超时');
    console.log('解决: 检查网络连接，重试');
  }
});
```

**快速修复:**
```bash
# Step 1: 确认云函数文件存在
ls miniprogram/cloudfunctions/login/index.js

# Step 2: 重新部署
# 在微信开发者工具中:
# 1. 右键 miniprogram/cloudfunctions/login/
# 2. 点击 "增量上传并部署"
# 3. 等待完成 (通常<30秒)

# Step 3: 验证部署
# 在控制台运行测试代码验证
```

---

## 2️⃣ 数据同步异常

### 问题2.1: 分数不同步

**症状:**
```
本地分数: 1000
云端分数: 500
用户现象: 换设备后分数丢失
```

**诊断流程:**

```javascript
// Step 1: 检查同步管理器状态
const syncManager = require('./utils/sync_manager.js');
const status = syncManager.getStatus();

console.log('同步状态:', status);
// 正常输出应为:
// {
//   isOnline: true,
//   queued: 0,
//   lastSync: 1702380000000,
//   isSyncing: false
// }

// Step 2: 检查是否有等待中的更新
if (status.queued > 0) {
  console.warn(`⚠️ 有${status.queued}条更新等待同步`);
  console.log('可能原因:');
  console.log('  1. 网络连接不稳定');
  console.log('  2. 同步间隔过长 (默认5秒)');
  console.log('  3. 云服务暂时不可用');
}

// Step 3: 手动触发同步
syncManager.manualSync()
  .then(() => console.log('✅ 同步完成'))
  .catch(err => console.error('❌ 同步失败:', err));

// Step 4: 验证云端数据
const cloudService = require('./utils/cloud_service.js');
cloudService.loadUserData()
  .then(userData => {
    console.log('云端用户数据:', userData);
    console.log('云端分数:', userData.totalScore);
  });
```

**常见原因与解决:**

| 症状 | 原因 | 解决方案 |
|------|------|--------|
| 一直显示queued>0 | 网络问题或云服务异常 | 检查网络，查看云平台状态 |
| 同步超时 | 云端响应缓慢 | 检查云函数是否正确部署 |
| 分数小于本地 | 新数据被旧数据覆盖 | 检查updateScore逻辑 |
| 同步后分数不变 | 数据库权限问题 | 检查write权限配置 |

---

### 问题2.2: 离线数据丢失

**症状:**
```
步骤:
  1. 开启飞行模式 (离线)
  2. 点击打击 (分数增加)
  3. 关闭飞行模式 (在线)
  4. 分数恢复到离线前的值 ❌ (应该保留新分数)

用户现象: 离线积累的分数被丢弃
```

**根本原因分析:**

```javascript
// 问题代码示例 (错误的实现):
onBagTap() {
  // ❌ 错误: 直接覆盖，没有合并逻辑
  this.data.totalScore = newScore;

  // 在线时会被云端数据覆盖
  this._syncLocalToCloud();
}

// ✅ 正确的实现:
onBagTap() {
  const newScore = this.data.totalScore + damage;
  this.data.totalScore = newScore;

  // 将更新加入同步队列 (即使离线也会保留)
  syncManager.saveScore(newScore)
    .catch(err => {
      // 离线时会缓存到本地
      console.log('离线模式，分数已缓存');
    });
}
```

**验证修复:**

```javascript
// 测试离线保存流程
console.log('=== 测试离线数据保存 ===');

// 1. 获取初始分数
const initialScore = this.data.totalScore;
console.log('初始分数:', initialScore);

// 2. 模拟离线
syncManager.isOnline = false;
console.log('模拟离线模式');

// 3. 打击并保存
const newScore = initialScore + 100;
this.data.totalScore = newScore;
syncManager.saveScore(newScore);
console.log('分数已更新 (离线模式):', newScore);

// 4. 检查本地缓存
const cached = wx.getStorageSync('game_data');
console.log('本地缓存:', cached);
if (cached.totalScore === newScore) {
  console.log('✅ 离线数据已正确保存');
} else {
  console.log('❌ 离线数据保存失败');
}

// 5. 恢复在线
syncManager.isOnline = true;
syncManager.manualSync()
  .then(() => {
    console.log('✅ 离线数据已同步到云端');
  });
```

---

### 问题2.3: 跨设备不同步

**症状:**
```
设备A: 分数 = 1000，已保存到云端
设备B: 登陆同一账号，分数仍为 0
用户现象: 设备B无法读取设备A的数据
```

**检查清单:**

```javascript
// 1. 验证使用同一账号
console.log('=== 验证账号一致性 ===');

// 获取两台设备的OpenID
cloudService.getUserId()
  .then(openid => {
    console.log('当前设备OpenID:', openid);
    // 应该与其他设备的OpenID相同
  });

// 2. 检查权限规则
// 打开微信平台 → 云数据库 → user_data集合 → 权限设置
// 检查是否为:
/*
{
  "read": "doc.openid == auth.uid",   // ✅ 正确
  "write": "doc.openid == auth.uid"   // ✅ 正确
}
*/

// 3. 手动查询对方数据
wx.cloud.database()
  .collection('user_data')
  .where({
    openid: 'ANOTHER_DEVICE_OPENID'  // 另一台设备的OpenID
  })
  .get()
  .then(res => {
    console.log('能否查到对方数据:', res.data);
    // 如果无法查到，说明权限有问题
  });

// 4. 强制刷新
cloudService.loadUserData(true)  // true = 强制云端查询
  .then(userData => {
    console.log('强制加载数据:', userData);
  });
```

**常见原因:**

| 问题 | 原因 | 验证方法 |
|------|------|--------|
| 不同的微信账号 | 使用了不同的微信登陆 | 检查两台设备的微信账号 |
| 权限配置错误 | read/write权限不对 | 查看云平台权限规则 |
| 数据查询超时 | 网络问题 | 查看控制台是否有timeout错误 |
| OpenID不一致 | 系统认为是不同的用户 | 对比两台设备的OpenID |

---

## 3️⃣ 成就系统故障

### 问题3.1: 成就无法解锁

**症状:**
```
用户已经点击100次，但"出气王"成就仍未解锁
控制台无任何成就解锁通知
```

**诊断代码:**

```javascript
// Step 1: 检查成就系统是否初始化
console.log('=== 成就系统诊断 ===');

const achievementSystem = require('./utils/achievement_system.js');
if (!achievementSystem) {
  console.error('❌ 成就系统未加载');
  return;
}

// Step 2: 检查成就列表
const allAchievements = achievementSystem.getAllAchievements();
console.log('成就总数:', allAchievements.length);
console.log('成就列表:', allAchievements.map(a => ({
  id: a.id,
  name: a.name,
  unlocked: a.unlocked,
  condition: a.condition
})));

// Step 3: 检查点击计数
const stats = achievementSystem.getProgress();
console.log('用户成就进度:', stats);
// 输出应包含: tapCount, totalScore, maxDamage等

// Step 4: 手动检查条件
const gameData = {
  totalScore: this.data.totalScore,
  maxCombo: this.data.comboCount,
  lastDamage: this.data.lastDamage,
  tapCount: 100  // 模拟100次点击
};

console.log('检查成就条件...');
allAchievements.forEach(achievement => {
  const condition = achievement.condition;
  let shouldUnlock = false;

  if (condition.type === 'tap_count') {
    shouldUnlock = gameData.tapCount >= condition.value;
  } else if (condition.type === 'single_damage') {
    shouldUnlock = gameData.lastDamage >= condition.value;
  }
  // ... 其他条件

  console.log(`${achievement.name}: 条件满足=${shouldUnlock}`);
});

// Step 5: 手动触发检查
achievementSystem.checkAchievements(gameData)
  .then(unlockedIds => {
    console.log('新解锁成就:', unlockedIds);
  })
  .catch(err => {
    console.error('检查成就失败:', err);
  });
```

**快速修复流程:**

```javascript
// 如果成就仍未解锁，尝试以下步骤:

// 1. 重新初始化成就系统
achievementSystem.init()
  .then(() => {
    console.log('✅ 成就系统已重新初始化');
  });

// 2. 清除本地缓存 (谨慎操作!)
wx.removeStorageSync('game_achievements');
wx.removeStorageSync('achievement_progress');
console.log('✅ 已清除本地缓存');

// 3. 重新启动游戏
// 用户应该：
// - 返回微信首页
// - 重新打开游戏
// - 成就系统会重新初始化

// 4. 验证修复
setTimeout(() => {
  const newStats = achievementSystem.getProgress();
  console.log('修复后的进度:', newStats);
}, 2000);
```

---

### 问题3.2: 成就重复解锁

**症状:**
```
已解锁的成就又解锁了一次
云端出现重复的achievement记录
用户现象: 成就通知重复出现
```

**根本原因:**

```javascript
// ❌ 错误的实现:
async checkAchievements(gameData) {
  for (let achievement of this.achievements) {
    if (this.isMet(achievement.condition, gameData)) {
      // 问题: 没有检查是否已解锁
      await this.unlockAchievement(achievement.id);
    }
  }
}

// ✅ 正确的实现:
async checkAchievements(gameData) {
  for (let achievement of this.achievements) {
    if (!achievement.unlocked &&  // 关键: 检查是否已解锁
        this.isMet(achievement.condition, gameData)) {
      await this.unlockAchievement(achievement.id);
    }
  }
}
```

**检查是否有重复:**

```javascript
// 查询云端重复记录
cloudService.db.collection('achievements')
  .where({
    openid: wx.getStorageSync('openid')
  })
  .get()
  .then(res => {
    // 统计每个成就的出现次数
    const achievementCounts = {};
    res.data.forEach(item => {
      achievementCounts[item.achievementId] =
        (achievementCounts[item.achievementId] || 0) + 1;
    });

    console.log('成就出现次数:', achievementCounts);

    // 检查是否有重复
    let hasDuplicates = false;
    for (let [achievementId, count] of Object.entries(achievementCounts)) {
      if (count > 1) {
        console.warn(`⚠️ 成就${achievementId}出现${count}次`);
        hasDuplicates = true;
      }
    }

    if (!hasDuplicates) {
      console.log('✅ 无重复解锁记录');
    }
  });
```

**修复步骤:**

```javascript
// 如果发现重复，手动清理:

// 1. 找出重复的achievement记录
// 2. 保留最早的一条，删除其余的

// 示例: 删除重复的"puncher"成就
const puncherRecords = res.data.filter(a => a.achievementId === 'puncher');
puncherRecords.sort((a, b) => a.unlockedAt - b.unlockedAt);

// 保留第一条，删除后续
for (let i = 1; i < puncherRecords.length; i++) {
  cloudService.db.collection('achievements')
    .doc(puncherRecords[i]._id)
    .remove();
}

console.log('✅ 已清理重复记录');
```

---

## 4️⃣ 性能瓶颈分析

### 问题4.1: 启动时间过长

**症状:**
```
游戏从点击到能打击需要3-4秒
预期: 应在2秒以内
```

**性能分析:**

```javascript
// 在app.js和index.js中添加打点统计

const timings = {};

// 记录关键时间点
function recordTiming(name) {
  timings[name] = Date.now();
  console.log(`⏱️ ${name}: ${timings[name]}`);
}

// 在app.js中
recordTiming('app.launch.start');

onLaunch() {
  recordTiming('app.launch.begin');

  this._initCloudService();
  recordTiming('cloud.init.end');

  syncManager.init();
  recordTiming('sync.init.end');
}

// 在index.js中
onLoad() {
  recordTiming('page.load.start');

  cloudService.init(ENV_ID);
  recordTiming('cloud.init.end');

  const cloudData = this.loadCloudGameData();
  recordTiming('cloud.data.loaded');

  achievementSystem.init();
  recordTiming('achievement.init.end');

  this.loadGameData();
  recordTiming('game.data.loaded');

  recordTiming('page.load.end');

  // 计算总耗时
  const totalTime = timings['page.load.end'] - timings['page.load.start'];
  console.log(`📊 页面总加载时间: ${totalTime}ms`);
}

// 输出性能报告
function reportPerformance() {
  console.log('=== 性能统计 ===');
  console.log('云服务初始化:',
    timings['cloud.init.end'] - timings['cloud.init.start'], 'ms');
  console.log('成就系统初始化:',
    timings['achievement.init.end'] - timings['achievement.init.start'], 'ms');
  console.log('数据加载:',
    timings['game.data.loaded'] - timings['cloud.data.loaded'], 'ms');
  console.log('页面总耗时:',
    timings['page.load.end'] - timings['page.load.start'], 'ms');
}
```

**性能优化建议:**

| 瓶颈 | 优化方案 | 预期效果 |
|------|--------|--------|
| 云服务初始化慢 | 提前初始化，使用缓存 | -300ms |
| 数据库查询慢 | 添加索引，本地缓存 | -500ms |
| UI渲染慢 | 虚拟滚动，延迟渲染 | -200ms |
| 网络延迟 | 预加载，局部更新 | -400ms |
| **总优化** | | **-1.4s** |

---

### 问题4.2: 内存持续增长

**症状:**
```
初始内存: 85MB
打击5分钟后: 120MB
打击10分钟后: 160MB → 内存溅射
用户现象: 游戏变卡、最后崩溃
```

**内存泄漏诊断:**

```javascript
// 在index.js中定期打印内存占用
let memoryCheckInterval = setInterval(() => {
  wx.getMemoryInfo({
    success: info => {
      console.log('=== 内存状态 ===');
      console.log('已用内存:', (info.currentMemory / 1024 / 1024).toFixed(1), 'MB');
      console.log('总内存:', (info.totalMemory / 1024 / 1024).toFixed(1), 'MB');
      console.log('使用率:',
        ((info.currentMemory / info.totalMemory) * 100).toFixed(1), '%');

      // 警告: 内存使用率>80%
      if ((info.currentMemory / info.totalMemory) > 0.8) {
        console.warn('⚠️ 内存使用率过高，可能出现溅射!');
        clearInterval(memoryCheckInterval);
      }
    }
  });
}, 1000);  // 每秒检查一次
```

**常见内存泄漏原因:**

```javascript
// ❌ 问题1: 事件监听未清除
wx.onNetworkStatusChange(res => {
  console.log('网络状态变化:', res);
  // 问题: 每打击一次都创建一个新监听
});

// ✅ 修复: 仅监听一次
wx.onNetworkStatusChange(res => {
  console.log('网络状态变化:', res);
});
// 或使用once:
wx.once('networkStatusChange', res => {
  // ...
});

// ❌ 问题2: 定时器未清除
this.tapTimer = setInterval(() => {
  // 打击处理
}, 10);
// 问题: 页面卸载时定时器仍在运行

// ✅ 修复: 页面卸载时清除
onUnload() {
  if (this.tapTimer) {
    clearInterval(this.tapTimer);
  }
}

// ❌ 问题3: 对象引用未释放
this.largeData = new Array(1000000).fill(0);
// 问题: 保持对大对象的引用

// ✅ 修复: 用完后释放
this.largeData = null;
delete this.largeData;
```

**内存优化技巧:**

```javascript
// 1. 对象池模式 (已使用在粒子特效)
class ObjectPool {
  constructor(ObjectClass, poolSize = 100) {
    this.pool = [];
    this.ObjectClass = ObjectClass;
    for (let i = 0; i < poolSize; i++) {
      this.pool.push(new ObjectClass());
    }
  }

  acquire() {
    return this.pool.length > 0 ?
      this.pool.pop() :
      new this.ObjectClass();
  }

  release(obj) {
    obj.reset();  // 重置对象状态
    this.pool.push(obj);
  }
}

// 2. 及时清理大对象
const largeArray = [... 大数据];
// 处理数据
largeArray = null;  // 及时释放

// 3. 使用弱引用 (WeakMap/WeakSet)
// ⚠️ 注意: 小程序不支持WeakMap/WeakSet
```

---

### 问题4.3: 帧率不稳定

**症状:**
```
正常时: 60fps
打击时: 30fps → 卡顿感明显
控制台显示掉帧警告
```

**帧率监控:**

```javascript
// 添加FPS计数器
let frameCount = 0;
let lastTime = Date.now();
let fps = 60;

// 在动画循环中
function gameLoop() {
  frameCount++;
  const now = Date.now();

  if (now - lastTime >= 1000) {
    fps = frameCount;
    console.log(`📊 当前FPS: ${fps}`);

    // 警告: FPS过低
    if (fps < 50) {
      console.warn(`⚠️ FPS过低: ${fps}，可能出现卡顿`);
      this._optimizePerformance();
    }

    frameCount = 0;
    lastTime = now;
  }

  // 继续下一帧
  requestAnimationFrame(gameLoop);
}

gameLoop();
```

**常见帧率问题:**

| 原因 | 表现 | 解决方案 |
|------|------|--------|
| 过度渲染 | 每帧计算太多 | 使用requestAnimationFrame，避免busy-loop |
| 同步操作 | UI阻塞 | 改为异步，分批处理 |
| 内存溅射 | 突然卡顿 | 优化内存，避免泄漏 |
| 网络请求 | 周期性卡顿 | 使用网络池，错开请求 |

---

## 5️⃣ 网络异常处理

### 问题5.1: 网络超时

**症状:**
```
用户打击后2秒内未收到响应
控制台显示: "Request timeout"
```

**超时处理代码:**

```javascript
// 使用Promise.race实现超时控制
function fetchWithTimeout(promise, timeoutMs = 5000) {
  const timeoutPromise = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('Request timeout'));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

// 示例: 保存分数时设置超时
async saveScoreWithTimeout(score) {
  try {
    await fetchWithTimeout(
      syncManager.saveScore(score),
      3000  // 3秒超时
    );
    console.log('✅ 分数保存成功');
  } catch (err) {
    if (err.message === 'Request timeout') {
      console.warn('⚠️ 网络超时，分数已缓存本地');
      // 数据会在恢复连接后自动同步
    } else {
      console.error('❌ 保存失败:', err);
    }
  }
}
```

**用户提示:**

```javascript
// 当网络异常时显示友好提示
if (!syncManager.isOnline) {
  wx.showToast({
    title: '离线模式',
    icon: 'info',
    duration: 2000
  });
} else if (error.code === 'timeout') {
  wx.showToast({
    title: '网络较慢',
    icon: 'loading',
    duration: 3000
  });
}
```

---

### 问题5.2: 间歇性连接丢失

**症状:**
```
网络: WiFi信号正常
表现: 时常同步失败，但过一会儿又恢复
```

**诊断和修复:**

```javascript
// 实现更智能的重试机制
class SmartRetry {
  constructor(maxRetries = 5, baseDelay = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.retryCount = 0;
  }

  async execute(fn) {
    let lastError;

    for (let i = 0; i < this.maxRetries; i++) {
      try {
        this.retryCount = i;
        return await fn();  // 执行函数
      } catch (error) {
        lastError = error;

        if (i < this.maxRetries - 1) {
          // 指数退避: 延迟 = baseDelay * 2^retryCount
          const delay = this.baseDelay * Math.pow(2, i);
          console.log(`重试 ${i + 1}/${this.maxRetries - 1}，等待${delay}ms`);

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}

// 使用示例
const retry = new SmartRetry(3, 500);  // 3次重试，初始延迟500ms

await retry.execute(async () => {
  return await syncManager.manualSync();
});
```

---

## 📊 快速参考表

### 症状速查表

| 症状 | 最可能原因 | 快速检查 | 解决耗时 |
|------|---------|--------|--------|
| 分数不保存 | 云服务未初始化 | 检查ENV_ID | 2分钟 |
| 换设备无数据 | 权限配置错误 | 检查数据库权限 | 5分钟 |
| 成就无法解锁 | 初始化顺序错误 | 检查achievementSystem.init() | 3分钟 |
| 离线数据丢失 | 本地缓存覆盖 | 检查saveScore逻辑 | 5分钟 |
| 游戏卡顿 | 内存泄漏 | 检查内存占用趋势 | 10分钟 |
| 网络超时 | 云平台过载 | 查看云平台监控 | 15分钟 |

---

## 🔧 工具和命令

### 控制台调试命令

```javascript
// 测试基础连接
wx.cloud.database().collection('user_data').count()
  .then(res => console.log('数据库连接正常', res.total));

// 查询当前用户的所有数据
wx.cloud.database().collection('user_data')
  .where({ openid: wx.getStorageSync('openid') })
  .get()
  .then(res => console.log('用户数据:', res.data));

// 查询用户的所有成就
wx.cloud.database().collection('achievements')
  .where({ openid: wx.getStorageSync('openid') })
  .get()
  .then(res => console.log('用户成就:', res.data));

// 查询排行榜Top 10
wx.cloud.database().collection('leaderboard')
  .orderBy('score', 'desc')
  .limit(10)
  .get()
  .then(res => console.log('排行榜:', res.data));

// 手动触发同步
require('./utils/sync_manager.js').manualSync();

// 清除本地缓存
wx.clearStorage();
console.log('本地缓存已清除');

// 获取系统信息
wx.getSystemInfo({
  success: info => console.log('系统信息:', {
    platform: info.platform,
    version: info.version,
    memory: info.memoryUsed + 'MB'
  })
});
```

---

## ✅ 排查检查表

```
□ 环境ID是否正确
□ 云函数是否已部署
□ 数据库集合是否存在
□ 数据库权限规则是否正确
□ 网络连接是否正常
□ 微信版本是否足够新
□ 基础库版本是否足够新
□ 本地缓存是否损坏
□ 是否有JavaScript错误
□ 是否有内存泄漏
```

---

**记住:** 大多数问题都是环境配置和网络相关，按照诊断流程逐步排查即可！

*文档完成时间: 2025-12-12 | 更新频率: 按需*
