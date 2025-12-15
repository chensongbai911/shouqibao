# 🎭 受气包渐进式受伤表情系统

## 📋 系统概述

全新升级的受气包渲染系统，根据累计伤害动态展示**生动的表情变化**和**鼻青脸肿效果**，让玩家获得更爽快、更解气的游戏体验！

---

## ✨ 核心特性

### 1️⃣ **渐进式表情系统** (6个阶段)

受气包会根据累计伤害百分比自动切换表情，越打越痛苦：

| 伤害阶段 | 表情状态 | 视觉特征 | 触发条件 |
|---------|---------|---------|---------|
| 😊 **正常** | `normal` | 眼睛正常，嘴巴微笑 | 0-5% 伤害 |
| 😣 **轻伤** | `hit_light` | 眼睛稍扁，嘴巴变平 | 5-20% 伤害 |
| 😖 **中伤** | `hit_medium` | 眼睛变扁，嘴巴下撇，开始肿胀 | 20-40% 伤害 |
| 😫 **重伤** | `hit_heavy` | 眼睛很扁，嘴巴大撇，明显肿胀 | 40-60% 伤害 |
| 😭 **严重** | `hurt_severe` | 眼睛变大（要哭），嘴巴向下弯，脸肿得厉害 | 60-80% 伤害 |
| 🤕 **濒死** | `dying` | 眼睛很小，嘴巴大开，脸严重肿胀，**眼冒金星** | 80-100% 伤害 |

### 2️⃣ **鼻青脸肿效果** (Bruise System)

每次击打都会在受气包表面**随机位置**生成青肿斑点：

```javascript
特性：
✅ 普通攻击：30% 概率产生轻微青肿（紫色斑点）
✅ 暴击攻击：100% 产生明显青肿
✅ 青肿会在3-5秒内渐变消失
✅ 最多同时显示20个青肿斑点
✅ 青肿颜色：紫蓝色渐变 (HSL: 0.75, 0.6, 0.2-0.5)
```

### 3️⃣ **眼冒金星效果** (Stars Effect)

当累计伤害达到80%以上（濒死状态）时，触发特效：

```javascript
效果：
⭐ 3-5颗黄色星星在头顶旋转
⭐ 星星随机高度和速度
⭐ 持续旋转直到伤害降低
```

### 4️⃣ **暴击特殊表情**

暴击时临时显示`crit`表情（500ms），然后恢复到正常受伤状态：

```javascript
crit 表情：
- 眼睛极度压扁 (scaleX: 2.0, scaleY: 0.1)
- 眼睛旋转45度
- 嘴巴大幅下撇
- 脸颊高度肿胀
```

---

## 🎨 视觉参数详解

### 表情配置参数

每个表情由以下参数控制：

```javascript
{
  eyeScale: { x, y },    // 眼睛缩放（x: 宽度, y: 高度）
  eyeRotation,           // 眼睛旋转角度（弧度）
  mouthCurve,            // 嘴巴曲线（正数=笑，负数=哭）
  cheekPuff,             // 脸颊肿胀程度（0-1）
  eyeBrowAngle           // 眉毛角度（负数=下垂）
}
```

### 具体数值

| 表情 | eyeScale.x | eyeScale.y | mouthCurve | cheekPuff |
|------|-----------|-----------|-----------|----------|
| normal | 1.0 | 1.0 | 0.3 | 0 |
| hit_light | 1.3 | 0.4 | 0 | 0.1 |
| hit_medium | 1.5 | 0.2 | -0.3 | 0.3 |
| hit_heavy | 1.7 | 0.15 | -0.6 | 0.5 |
| hurt_severe | 0.8 | 1.4 | -0.8 | 0.7 |
| dying | 0.5 | 0.5 | -1.0 | 1.0 |
| crit | 2.0 | 0.1 | -0.9 | 0.8 |

---

## 🔧 API 使用指南

### 核心方法

#### 1. 根据伤害更新表情
```javascript
// 自动根据伤害百分比选择表情
bag3DRenderer.updateExpressionByDamage(damagePercent);

// 参数：
// damagePercent: 0-100 的伤害百分比
```

#### 2. 添加青肿斑点
```javascript
// 在指定位置添加青肿
const position = new THREE.Vector3(x, y, z);
bag3DRenderer.addBruise(position, intensity);

// 参数：
// position: 3D坐标 (Vector3)
// intensity: 强度 0-1 (0.3=轻微, 0.8=明显)
```

#### 3. 添加眼冒金星效果
```javascript
// 显示星星旋转效果
bag3DRenderer.addStarsEffect();
```

#### 4. 清除所有受伤效果
```javascript
// 重置所有受伤状态（重置游戏时调用）
bag3DRenderer.clearDamageEffects();
```

---

## 🎮 游戏集成示例

### 击打逻辑中的调用

```javascript
changeBagExpression(isCrit) {
  const maxHealth = 10000;
  const damagePercent = (this.data.totalScore / maxHealth) * 100;

  if (isCrit) {
    // 暴击：显示暴击表情
    this.bag3DRenderer.changeExpression('crit');

    // 添加明显青肿
    const hitPos = this.get3DHitPosition();
    this.bag3DRenderer.addBruise(hitPos, 0.8);

    // 濒死时添加星星
    if (damagePercent >= 80) {
      this.bag3DRenderer.addStarsEffect();
    }

    // 500ms后恢复正常受伤状态
    setTimeout(() => {
      this.bag3DRenderer.updateExpressionByDamage(damagePercent);
    }, 500);
  } else {
    // 普通攻击：直接更新表情
    this.bag3DRenderer.updateExpressionByDamage(damagePercent);

    // 30%概率添加轻微青肿
    if (Math.random() > 0.7) {
      const hitPos = this.get3DHitPosition();
      this.bag3DRenderer.addBruise(hitPos, 0.3 + Math.random() * 0.3);
    }
  }
}
```

### 随机生成击打位置

```javascript
get3DHitPosition() {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const radius = 2.0; // 受气包半径

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}
```

---

## 📊 性能优化

### 青肿管理
- **最大数量限制**：20个青肿（超过会自动删除最旧的）
- **自动清理**：3-5秒后渐变消失
- **内存管理**：及时释放Geometry和Material

### 渲染优化
- **按需渲染**：只在状态改变时重新渲染
- **平滑过渡**：使用插值算法（EXPRESSION_LERP = 0.18）
- **帧率控制**：集成在主渲染循环中

---

## 🎯 效果展示

### 打击过程：

```
初始状态: 😊 (开心)
    ↓ 打击5次
  轻微受伤: 😣 (有点疼) + 1-2个青肿
    ↓ 打击20次
  中度受伤: 😖 (很疼) + 5-8个青肿
    ↓ 打击50次
  重度受伤: 😫 (非常疼) + 10-15个青肿
    ↓ 打击100次
  严重受伤: 😭 (要哭了) + 15-20个青肿
    ↓ 打击150次
  濒死状态: 🤕 (眼冒金星) + 20个青肿 + ⭐⭐⭐
```

---

## 🚀 未来扩展

可以添加的效果：

1. **眼泪粒子**：严重受伤时掉眼泪
2. **肿胀动画**：脸部真实的3D肿胀变形
3. **烟雾效果**：暴击时冒烟
4. **伤口贴纸**：创可贴、纱布等
5. **表情声音**：哭泣、呻吟音效

---

## 📝 注意事项

1. **伤害计算**：需要定义合理的maxHealth值（建议10000）
2. **性能监控**：在低端设备上注意青肿数量
3. **兼容性**：确保THREE.js版本支持Vector3
4. **重置逻辑**：游戏重置时记得调用clearDamageEffects()

---

**版本**: V1.0
**更新日期**: 2025-12-15
**状态**: ✅ 已完成并集成
