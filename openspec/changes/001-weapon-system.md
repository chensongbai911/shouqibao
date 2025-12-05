# Change Proposal: 武器切换系统

**提案编号:** 001
**创建日期:** 2025-12-05
**状态:** 待审核
**优先级:** P1 (重要)
**预计工期:** 1天

## 概述

实现武器切换功能，让用户可以选择不同的打击工具（拳头、拖鞋、键盘等），每种武器具有独特的伤害值、音效和视觉效果，提升游戏趣味性和重玩价值。

## 动机

### 问题陈述
- 当前版本只有单一的点击交互，缺乏变化性
- 用户容易产生疲劳感，缺少探索和解锁的成就感
- 需要增加游戏深度，延长用户留存时间

### 用户价值
- 提供多样化的打击体验
- 通过武器收集增加成就感
- 不同武器的伤害差异带来策略选择（效率 vs 趣味）

## 详细设计

### 功能需求

#### 武器列表（第一版）
| 武器名称 | 伤害值 | 解锁条件 | 特殊效果 |
|---------|--------|---------|---------|
| 👊 拳头 | 1 | 默认 | 基础音效 |
| 🩴 拖鞋 | 3 | 累计100伤害 | "啪啪"声 |
| ⌨️ 键盘 | 5 | 累计500伤害 | 机械键盘声 |
| 🔨 锤子 | 10 | 累计2000伤害 | 重击音效 + 屏幕震动加强 |

#### 交互流程
1. 用户点击底部"武器"图标
2. 弹出武器选择面板（半屏弹窗）
3. 显示已解锁武器（彩色）和未解锁武器（灰色 + 锁图标）
4. 点击已解锁武器切换，显示"已装备"提示
5. 点击未解锁武器，显示解锁进度条（如："再打100下解锁"）

### 技术实现

#### 数据结构
```javascript
// data 定义
data: {
  weapons: [
    {
      id: 'fist',
      name: '拳头',
      emoji: '👊',
      damage: 1,
      unlockScore: 0,
      audioSrc: '/audio/punch.mp3',
      isUnlocked: true
    },
    {
      id: 'slipper',
      name: '拖鞋',
      emoji: '🩴',
      damage: 3,
      unlockScore: 100,
      audioSrc: '/audio/slap.mp3',
      isUnlocked: false
    },
    // ... 更多武器
  ],
  currentWeapon: null, // 当前装备的武器对象
  showWeaponPanel: false
}
```

#### 核心方法
```javascript
// 切换武器
onWeaponSelect(e) {
  const weaponId = e.currentTarget.dataset.id;
  const weapon = this.data.weapons.find(w => w.id === weaponId);

  if (!weapon.isUnlocked) {
    wx.showToast({
      title: `再打${weapon.unlockScore - this.data.totalScore}下解锁`,
      icon: 'none'
    });
    return;
  }

  this.setData({
    currentWeapon: weapon,
    showWeaponPanel: false
  });

  // 更新音频池
  this.audioPool.updateAudioSrc(weapon.audioSrc);
}

// 检查武器解锁
checkWeaponUnlock() {
  const updated = this.data.weapons.map(weapon => {
    if (!weapon.isUnlocked && this.data.totalScore >= weapon.unlockScore) {
      weapon.isUnlocked = true;
      // 显示解锁动画
      this.showUnlockAnimation(weapon);
    }
    return weapon;
  });
  this.setData({ weapons: updated });
}
```

### UI 设计

#### 武器选择面板（WXML）
```xml
<!-- 底部武器按钮 -->
<view class="weapon-btn" bindtap="toggleWeaponPanel">
  <text>{{currentWeapon.emoji}}</text>
</view>

<!-- 武器选择弹窗 -->
<view class="weapon-panel" wx:if="{{showWeaponPanel}}">
  <view class="panel-title">选择武器</view>
  <view class="weapon-grid">
    <view
      wx:for="{{weapons}}"
      wx:key="id"
      class="weapon-item {{item.isUnlocked ? '' : 'locked'}}"
      data-id="{{item.id}}"
      bindtap="onWeaponSelect">

      <text class="weapon-emoji">{{item.emoji}}</text>
      <text class="weapon-name">{{item.name}}</text>
      <text class="weapon-damage">伤害 {{item.damage}}</text>

      <image wx:if="{{!item.isUnlocked}}"
             class="lock-icon"
             src="/images/lock.png"/>

      <text wx:if="{{currentWeapon.id === item.id}}"
            class="equipped-tag">已装备</text>
    </view>
  </view>
</view>
```

#### 样式要点（WXSS）
```css
.weapon-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: linear-gradient(180deg, #FFF 0%, #FFE5B4 100%);
  border-radius: 40rpx 40rpx 0 0;
  box-shadow: 0 -10rpx 40rpx rgba(0,0,0,0.2);
  animation: slideUp 0.3s ease;
}

.weapon-item {
  width: 150rpx;
  height: 180rpx;
  background: #FFF;
  border-radius: 20rpx;
  border: 4rpx solid #FFD700;
  position: relative;
}

.weapon-item.locked {
  opacity: 0.5;
  filter: grayscale(100%);
}

.unlock-animation {
  animation: unlock 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes unlock {
  0% { transform: scale(0.3) rotate(0deg); }
  50% { transform: scale(1.2) rotate(180deg); }
  100% { transform: scale(1) rotate(360deg); }
}
```

## 影响范围

### 修改的文件
- `pages/index/index.wxml` - 添加武器面板UI
- `pages/index/index.wxss` - 添加武器面板样式
- `pages/index/index.js` - 添加武器切换逻辑
- `utils/audio_manager.js` - 支持动态切换音频源

### 新增的文件
- `images/lock.png` - 锁定图标
- `audio/slap.mp3` - 拖鞋音效
- `audio/keyboard.mp3` - 键盘音效
- `audio/hammer.mp3` - 锤子音效

### 数据库变更
```javascript
// users 集合添加字段
{
  _openid: String,
  score: Number,
  updateTime: Date,
  unlockedWeapons: Array, // 新增：已解锁武器ID列表
  currentWeapon: String   // 新增：当前装备武器ID
}
```

## 测试计划

### 单元测试
- [ ] 武器切换逻辑测试
- [ ] 解锁条件判断测试
- [ ] 伤害计算准确性测试

### 功能测试
- [ ] 默认武器正常工作
- [ ] 武器切换后音效和伤害正确
- [ ] 未解锁武器显示锁定状态
- [ ] 达到解锁条件时触发解锁动画
- [ ] 解锁进度提示准确

### 边界测试
- [ ] 快速连续切换武器不卡顿
- [ ] 同时达到多个武器解锁条件
- [ ] 武器面板在不同屏幕尺寸下正常显示

## 风险评估

### 技术风险
- **中等** - 音频池需要支持动态切换音频源，可能需要重构
- **低** - 武器面板动画性能问题

### 缓解措施
- 提前测试音频切换的流畅性
- 使用 CSS 动画替代 JS 动画
- 武器面板使用虚拟列表优化（如果武器数量 > 20）

## 替代方案

### 方案A：简化版（推荐MVP）
- 只实现3种武器：拳头、拖鞋、键盘
- 所有武器默认解锁，无需解锁机制
- 减少开发时间至0.5天

### 方案B：高级版（后续迭代）
- 增加武器升级系统（如：木锤 → 铁锤 → 雷神之锤）
- 武器特效（如：火焰拳、冰冻锤）
- 武器成就系统

## 验收标准

- [ ] 用户可以通过底部按钮打开武器面板
- [ ] 武器面板正确显示已解锁和未解锁状态
- [ ] 切换武器后，点击受气包使用对应的音效和伤害值
- [ ] 达到解锁条件时，显示解锁动画并解锁武器
- [ ] 武器选择状态持久化（重新打开小程序后保持）
- [ ] 所有交互响应时间 < 100ms

## 后续工作

1. 收集用户反馈，调整武器平衡性
2. 根据数据分析，优化解锁曲线
3. 考虑添加限定武器（如：节日主题武器）
4. 探索武器皮肤系统

## 参考资料

- [微信小程序音频API文档](https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/wx.createInnerAudioContext.html)
- [emoji 表情列表](https://emojipedia.org/)
- 类似案例：《拳头侠》小游戏武器系统
