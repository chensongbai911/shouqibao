# Change Proposal: 伤害飘字特效

**提案编号:** 002
**创建日期:** 2025-12-05
**状态:** 待审核
**优先级:** P0 (核心)
**预计工期:** 0.5天

## 概述

实现点击受气包时显示动态伤害数字飘字特效，从受击点向上飘动并逐渐消失，增强打击反馈的视觉冲击力和爽感。

## 动机

### 问题陈述
- 当前点击反馈只有图片抖动和音效，缺少直观的数值反馈
- 用户无法感知每次点击的伤害量
- 缺少"打击感"的核心视觉元素

### 用户价值
- 即时的视觉反馈，强化"爽感"
- 清晰展示伤害数值，满足数值成长的心理需求
- 暴击、连击等特殊效果的视觉基础

## 详细设计

### 功能需求

#### 飘字效果规格
- **基础飘字：** 显示伤害数值（如 "-1", "-3"）
- **颜色：** 红色 (#FF0000)
- **字体大小：** 60rpx（暴击时放大到 80rpx）
- **动画：** 向上飘动 100rpx，同时渐隐（opacity: 1 → 0）
- **时长：** 800ms
- **随机偏移：** X轴 ±50rpx，避免重叠

#### 特殊效果
| 触发条件 | 显示文字 | 颜色 | 大小 | 特效 |
|---------|---------|------|------|------|
| 普通伤害 | -N | #FF0000 | 60rpx | 基础飘动 |
| 暴击（10%概率）| -N 暴击! | #FF4500 | 80rpx | 放大弹跳 |
| 连击 ≥5 | 连击 x5 | #FFD700 | 70rpx | 金色闪光 |

### 技术实现

#### 数据结构
```javascript
data: {
  damageTexts: [], // 飘字数组
  nextDamageId: 0  // 飘字唯一ID
}

// 飘字对象结构
{
  id: 1,
  value: -5,
  x: 375,      // rpx 单位
  y: 600,      // rpx 单位
  isCrit: false,
  isCombo: false,
  comboCount: 0
}
```

#### 核心方法
```javascript
/**
 * 显示伤害飘字
 * @param {number} damage - 伤害值
 * @param {object} position - 点击位置 {x, y}
 */
showDamageText(damage, position) {
  const isCrit = Math.random() < 0.1; // 10% 暴击率
  const actualDamage = isCrit ? damage * 2 : damage;

  // 随机偏移避免重叠
  const offsetX = (Math.random() - 0.5) * 100;

  const damageText = {
    id: this.data.nextDamageId++,
    value: -actualDamage,
    x: position.x + offsetX,
    y: position.y,
    isCrit: isCrit,
    isCombo: this.data.comboCount >= 5,
    comboCount: this.data.comboCount
  };

  // 添加到数组
  this.setData({
    damageTexts: [...this.data.damageTexts, damageText]
  });

  // 800ms 后移除
  setTimeout(() => {
    this.removeDamageText(damageText.id);
  }, 800);
}

/**
 * 移除飘字
 */
removeDamageText(id) {
  this.setData({
    damageTexts: this.data.damageTexts.filter(d => d.id !== id)
  });
}

/**
 * 处理点击事件
 */
onBagTap(e) {
  const { clientX, clientY } = e.detail;

  // 转换为 rpx（750rpx = 屏幕宽度）
  const screenWidth = wx.getSystemInfoSync().windowWidth;
  const x = (clientX / screenWidth) * 750;
  const y = (clientY / screenWidth) * 750;

  const damage = this.data.currentWeapon.damage;
  this.showDamageText(damage, { x, y });

  // ...existing code...
}
```

### UI 设计

#### WXML 结构
```xml
<!-- 飘字容器 -->
<view class="damage-container">
  <view
    wx:for="{{damageTexts}}"
    wx:key="id"
    class="damage-text {{item.isCrit ? 'crit' : ''}} {{item.isCombo ? 'combo' : ''}}"
    style="left: {{item.x}}rpx; top: {{item.y}}rpx;">

    <!-- 普通伤害 -->
    <text wx:if="{{!item.isCrit && !item.isCombo}}">{{item.value}}</text>

    <!-- 暴击 -->
    <text wx:if="{{item.isCrit}}">{{item.value}} 暴击!</text>

    <!-- 连击 -->
    <text wx:if="{{item.isCombo && !item.isCrit}}">连击 x{{item.comboCount}}</text>
  </view>
</view>
```

#### WXSS 样式
```css
.damage-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 不阻挡点击 */
  z-index: 9999;
}

.damage-text {
  position: absolute;
  font-size: 60rpx;
  font-weight: bold;
  color: #FF0000;
  text-shadow: 2rpx 2rpx 4rpx rgba(0, 0, 0, 0.5);
  animation: floatUp 0.8s ease-out forwards;
}

/* 暴击样式 */
.damage-text.crit {
  font-size: 80rpx;
  color: #FF4500;
  animation: critFloat 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

/* 连击样式 */
.damage-text.combo {
  font-size: 70rpx;
  color: #FFD700;
  text-shadow: 0 0 20rpx #FFD700;
}

/* 基础飘动动画 */
@keyframes floatUp {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-100rpx) scale(0.8);
    opacity: 0;
  }
}

/* 暴击弹跳动画 */
@keyframes critFloat {
  0% {
    transform: translateY(0) scale(0.5);
    opacity: 1;
  }
  30% {
    transform: translateY(-30rpx) scale(1.3);
  }
  100% {
    transform: translateY(-120rpx) scale(0.8);
    opacity: 0;
  }
}
```

## 影响范围

### 修改的文件
- `pages/index/index.wxml` - 添加飘字容器
- `pages/index/index.wxss` - 添加飘字动画样式
- `pages/index/index.js` - 添加飘字逻辑

### 新增的文件
无

## 测试计划

### 功能测试
- [ ] 点击后正确显示伤害数值
- [ ] 飘字动画流畅，800ms后消失
- [ ] 连续点击时飘字不重叠（随机偏移生效）
- [ ] 暴击效果正确触发（约10%概率）
- [ ] 连击效果正确显示

### 性能测试
- [ ] 快速连续点击（>10次/秒）不卡顿
- [ ] 同时存在 ≥20 个飘字时性能正常
- [ ] 飘字数组及时清理，无内存泄漏

### 边界测试
- [ ] 屏幕边缘点击，飘字不超出屏幕
- [ ] 不同屏幕尺寸下位置正确

## 风险评估

### 技术风险
- **低** - CSS 动画性能优异，不会造成卡顿
- **低** - 飘字数组可能无限增长

### 缓解措施
- 限制同时存在的飘字数量（最多30个）
- 使用 `setTimeout` 自动清理过期飘字
- 避免频繁 `setData`，合并数组操作

## 替代方案

### 方案A：Canvas 渲染（不推荐）
- 优点：性能更高，支持复杂特效
- 缺点：开发复杂度高，不支持文字自适应

### 方案B：只显示总分变化（简化版）
- 优点：实现简单
- 缺点：缺少即时反馈，体验差

## 验收标准

- [ ] 每次点击都显示对应伤害飘字
- [ ] 飘字从点击位置向上飘动并渐隐
- [ ] 暴击时飘字更大，带弹跳效果
- [ ] 连击时显示金色连击提示
- [ ] 快速连续点击时飘字不重叠
- [ ] 动画流畅，帧率 ≥ 30fps

## 后续工作

1. 添加更多特殊效果（如：完美打击、连击里程碑）
2. 飘字轨迹多样化（弧线、散射）
3. 根据伤害区间显示不同颜色
4. 添加音效配合（暴击音、连击音）

## 参考资料

- [CSS Animation 性能优化](https://web.dev/animations-guide/)
- 参考游戏：《Tap Titans》《Clicker Heroes》伤害飘字效果
