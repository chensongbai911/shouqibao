# Change Proposal: 彩蛋系统

**提案编号:** 005
**创建日期:** 2025-12-05
**状态:** 待审核
**优先级:** P2 (增强)
**预计工期:** 0.5天

## 概述

实现多种隐藏彩蛋机制，通过特定条件触发趣味互动，增加探索乐趣和惊喜感，提升用户粘性和分享意愿。

## 动机

### 问题陈述
- 游戏内容较为单一，缺少探索性
- 用户容易产生疲劳感，缺少新鲜感
- 缺少话题点，不利于社交传播

### 用户价值
- 意外的惊喜增强游戏趣味性
- 探索彩蛋带来成就感
- 提供社交话题（"你发现了XX彩蛋吗？"）

## 详细设计

### 功能需求

#### 彩蛋列表（第一版）

| 彩蛋名称 | 触发条件 | 效果 | 优先级 |
|---------|---------|------|-------|
| **嘲讽语音** | 5秒无操作 | 受气包说话："就这？不打了？" | P0 |
| **暴怒模式** | 连续点击50次（10秒内） | 背景变红，伤害x2，持续5秒 | P1 |
| **幸运暴击** | 随机1%概率 | 伤害x10，金币雨特效 | P1 |
| **摇一摇彩蛋** | 摇晃手机 | 受气包旋转飞出屏幕，+100分 | P1 |
| **时间彩蛋** | 凌晨0:00-1:00游玩 | 显示"夜深了，早点休息吧" | P2 |
| **节日彩蛋** | 特定节日（春节/情人节） | 特殊皮肤和音效 | P2 |

### 技术实现

#### 数据结构
```javascript
data: {
  idleTimer: null,        // 无操作计时器
  clickCount: 0,          // 连续点击计数
  clickTimer: null,       // 点击计时器
  rageMode: false,        // 暴怒模式状态
  easterEggsFound: []     // 已触发的彩蛋列表
}
```

#### 核心方法

**1. 嘲讽语音彩蛋**
```javascript
/**
 * 重置无操作计时器
 */
resetIdleTimer() {
  clearTimeout(this.data.idleTimer);

  const timer = setTimeout(() => {
    this.triggerTauntEasterEgg();
  }, 5000); // 5秒无操作

  this.setData({ idleTimer: timer });
}

/**
 * 触发嘲讽彩蛋
 */
triggerTauntEasterEgg() {
  const taunts = [
    "就这？不打了？",
    "你是不是怕了？",
    "来啊，继续打我啊！",
    "这么快就累了？"
  ];

  const randomTaunt = taunts[Math.floor(Math.random() * taunts.length)];

  // 显示气泡
  this.showSpeechBubble(randomTaunt);

  // 播放语音（TTS或预录音）
  const audio = wx.createInnerAudioContext();
  audio.src = '/audio/taunt.mp3';
  audio.play();

  // 记录彩蛋
  this.recordEasterEgg('taunt');
}

/**
 * 显示对话气泡
 */
showSpeechBubble(text) {
  this.setData({
    speechText: text,
    showSpeech: true
  });

  setTimeout(() => {
    this.setData({ showSpeech: false });
  }, 3000);
}
```

**2. 暴怒模式彩蛋**
```javascript
/**
 * 检测连续点击
 */
onBagTap() {
  const now = Date.now();

  // 增加点击计数
  this.setData({
    clickCount: this.data.clickCount + 1
  });

  // 10秒内点击50次触发
  clearTimeout(this.data.clickTimer);
  const timer = setTimeout(() => {
    if (this.data.clickCount >= 50) {
      this.triggerRageMode();
    }
    this.setData({ clickCount: 0 });
  }, 10000);

  this.setData({ clickTimer: timer });

  // ...existing code...
}

/**
 * 触发暴怒模式
 */
triggerRageMode() {
  wx.showToast({
    title: '🔥 暴怒模式！',
    icon: 'none'
  });

  this.setData({ rageMode: true });

  // 5秒后恢复
  setTimeout(() => {
    this.setData({ rageMode: false });
  }, 5000);

  // 记录彩蛋
  this.recordEasterEgg('rage');
}
```

**3. 摇一摇彩蛋**
```javascript
/**
 * 启用摇一摇监听
 */
onLoad() {
  wx.onAccelerometerChange(this.onShake.bind(this));
  wx.startAccelerometer({ interval: 'game' });
}

/**
 * 检测摇晃
 */
onShake(res) {
  const { x, y, z } = res;
  const acceleration = Math.sqrt(x * x + y * y + z * z);

  // 加速度超过阈值
  if (acceleration > 2.5) {
    this.triggerShakeEasterEgg();
  }
}

/**
 * 触发摇一摇彩蛋
 */
triggerShakeEasterEgg() {
  // 防抖：5秒内只触发一次
  if (this.shakeDebounce) return;
  this.shakeDebounce = true;

  // 受气包飞出动画
  this.setData({ bagFlying: true });

  setTimeout(() => {
    this.setData({
      bagFlying: false,
      totalScore: this.data.totalScore + 100
    });

    wx.showToast({
      title: '摇出了 +100 分！',
      icon: 'success'
    });
  }, 1000);

  setTimeout(() => {
    this.shakeDebounce = false;
  }, 5000);

  // 记录彩蛋
  this.recordEasterEgg('shake');
}
```

**4. 彩蛋记录系统**
```javascript
/**
 * 记录已触发彩蛋
 */
recordEasterEgg(eggId) {
  const found = wx.getStorageSync('easterEggsFound') || [];

  if (!found.includes(eggId)) {
    found.push(eggId);
    wx.setStorageSync('easterEggsFound', found);

    // 首次触发显示提示
    wx.showModal({
      title: '🎉 发现彩蛋！',
      content: `你触发了隐藏彩蛋：${this.getEggName(eggId)}`,
      showCancel: false
    });
  }
}

/**
 * 获取彩蛋名称
 */
getEggName(eggId) {
  const names = {
    taunt: '嘲讽语音',
    rage: '暴怒模式',
    shake: '摇一摇惊喜',
    lucky: '幸运暴击'
  };
  return names[eggId] || '未知彩蛋';
}
```

### UI 设计

#### WXML 结构
```xml
<!-- 对话气泡 -->
<view class="speech-bubble" wx:if="{{showSpeech}}">
  <text>{{speechText}}</text>
  <view class="bubble-arrow"></view>
</view>

<!-- 暴怒模式特效 -->
<view class="rage-overlay" wx:if="{{rageMode}}">
  <text class="rage-text">🔥 暴怒模式 🔥</text>
</view>

<!-- 飞出动画 -->
<image
  class="bag-image {{bagFlying ? 'flying' : ''}}"
  src="/images/bag_normal.png"/>

<!-- 彩蛋收集页面入口 -->
<view class="eggs-btn" bindtap="showEasterEggsPage">
  <text>🥚 {{easterEggsFound.length}}/6</text>
</view>
```

#### WXSS 样式
```css
/* 对话气泡 */
.speech-bubble {
  position: absolute;
  top: 200rpx;
  left: 50%;
  transform: translateX(-50%);
  background: #FFF;
  padding: 20rpx 40rpx;
  border-radius: 30rpx;
  font-size: 32rpx;
  color: #333;
  box-shadow: 0 8rpx 20rpx rgba(0,0,0,0.2);
  animation: bounce 0.5s ease;
}

.bubble-arrow {
  position: absolute;
  bottom: -20rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 20rpx solid transparent;
  border-right: 20rpx solid transparent;
  border-top: 20rpx solid #FFF;
}

/* 暴怒模式叠加层 */
.rage-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 0, 0, 0.3);
  pointer-events: none;
  animation: rageFlash 0.5s infinite;
}

.rage-text {
  position: absolute;
  top: 100rpx;
  left: 50%;
  transform: translateX(-50%);
  font-size: 60rpx;
  font-weight: bold;
  color: #FFF;
  text-shadow: 0 0 20rpx #FF0000;
}

@keyframes rageFlash {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

/* 飞出动画 */
.bag-image.flying {
  animation: flyOut 1s ease-out forwards;
}

@keyframes flyOut {
  0% {
    transform: translateY(0) rotate(0deg) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-1000rpx) rotate(720deg) scale(0.2);
    opacity: 0;
  }
}

/* 彩蛋收集按钮 */
.eggs-btn {
  position: fixed;
  bottom: 100rpx;
  right: 30rpx;
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #FFF;
  box-shadow: 0 8rpx 16rpx rgba(255, 215, 0, 0.4);
}
```

## 影响范围

### 修改的文件
- `pages/index/index.wxml` - 添加彩蛋UI元素
- `pages/index/index.wxss` - 添加彩蛋动画样式
- `pages/index/index.js` - 添加彩蛋触发逻辑

### 新增的文件
- `audio/taunt.mp3` - 嘲讽语音音效
- `pages/eggs/eggs.js/wxml/wxss` - 彩蛋收集页面（可选）

### 权限配置
```json
// app.json
{
  "permission": {
    "scope.accelerometer": {
      "desc": "检测摇一摇彩蛋"
    }
  }
}
```

## 测试计划

### 功能测试
- [ ] 5秒无操作触发嘲讽语音
- [ ] 10秒内连续点击50次触发暴怒模式
- [ ] 摇晃手机触发飞出彩蛋
- [ ] 彩蛋记录正确保存
- [ ] 首次触发显示发现提示

### 边界测试
- [ ] 彩蛋触发后不重复提示
- [ ] 多个彩蛋同时触发不冲突
- [ ] 摇一摇防抖机制生效

## 风险评估

### 技术风险
- **低** - 加速度计在部分设备上不准确
- **低** - 语音文件增加包体积

### 缓解措施
- 提供手动触发备用方案
- 语音使用 TTS 或短音效（<5秒）

## 替代方案

### 方案A：简化版（只实现嘲讽语音）
- 优点：开发快速，风险低
- 缺点：彩蛋种类少，吸引力低

### 方案B：服务器下发彩蛋配置（高级版）
- 优点：可动态更新彩蛋内容
- 缺点：需要后端支持

## 验收标准

- [ ] 至少实现3种彩蛋
- [ ] 彩蛋触发条件准确
- [ ] 彩蛋特效流畅自然
- [ ] 首次触发显示发现提示
- [ ] 彩蛋记录持久化保存

## 后续工作

1. 添加更多创意彩蛋（长按、双指缩放等）
2. 实现彩蛋图鉴页面
3. 彩蛋成就系统（收集全部彩蛋奖励）
4. 社交分享彩蛋发现

## 参考资料

- [微信小程序加速度计 API](https://developers.weixin.qq.com/miniprogram/dev/api/device/accelerometer/wx.onAccelerometerChange.html)
- 参考游戏：《跳一跳》隐藏关卡、《欢乐斗地主》彩蛋设计
