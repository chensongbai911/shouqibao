# 📦 受气包库系统功能文档

## 系统概述

完整实现了**多种受气包样式库**，用户可以通过"包库"菜单选择不同的3D包模型，每个包都由Three.js完全生成，支持10种不同的包样式。

## 功能特性

### 🎨 包的类型（共10种）

| 包名 | ID | 稀有度 | 描述 |
|------|----|----|------|
| 经典圆形包 | `classical` | 普通 | 经典的圆形受气包，圆润可爱 |
| Q弹果冻包 | `jelly` | 普通 | 软弹感果冻体质，QQ软软 |
| 刺猬包 | `hedgehog` | 优秀 | 全身带刺，气势十足 |
| 方块包 | `cube` | 优秀 | 立方体风格，方正有力 |
| 星形包 | `star` | 稀有 | 多角星状，闪闪发光 |
| 水果包 | `fruit` | 稀有 | 橙子形状，香甜多汁 |
| 毛绒包 | `fuzzy` | 史诗 | 毛茸茸的，柔软舒适 |
| 结晶包 | `crystal` | 史诗 | 水晶钻石质感，闪耀夺目 |
| 火焰包 | `flame` | 传说 | 熊熊烈火，怒火涛涛 |
| 金属包 | `metal` | 传说 | 坚硬金属质感，刚毅有力 |

### 🎮 用户交互流程

1. **打开包库**：点击底部浮动菜单中的"🎒 包库"按钮
2. **浏览模型**：在网格中查看所有可用的包模型（带3D预览）
3. **选择包**：点击想要的包模型
4. **立即应用**：选择后立即切换到该包模型
5. **关闭面板**：点击关闭按钮或背景蒙层

### 💾 保存与恢复

- 用户的包模型选择会自动保存到本地存储
- 页面重新加载时会恢复用户的选择

## 技术实现

### 文件结构

```
miniprogram/
├── utils/
│   ├── bag_models.js          # 新增：包模型定义和创建函数
│   └── bag_3d.js              # 已修改：支持多模型切换
├── pages/
│   └── index/
│       ├── index.wxml         # 已修改：添加包库UI
│       ├── index.js           # 已修改：添加包库逻辑
│       └── index.wxss         # 已修改：添加包库样式
```

### 核心API

#### `bag_models.js` - 包模型定义

```javascript
// 包模型定义表
const BAG_MODELS = {
  classical: {
    id: 'classical',
    name: '经典圆形包',
    description: '经典的圆形受气包，圆润可爱',
    rarity: 'common',
    creator: createClassicalBag
  },
  // ... 其他9种包
};

// 模型创建函数
function createClassicalBag(THREE, materials)
function createJellyBag(THREE, materials)
function createHedgehogBag(THREE, materials)
// ... 其他创建函数
```

#### `bag_3d.js` - 渲染器扩展

```javascript
// 切换包模型
bag3DRenderer.changeBagModel(modelId)

// 获取所有可用模型列表
bag3DRenderer.getBagModelList()

// 获取当前选中的包模型ID
bag3DRenderer.currentBagModelId

// 获取当前包的Three.js mesh
bag3DRenderer.bagModelMesh
```

#### `index.js` - 页面逻辑

```javascript
// 初始化包库
initBagLibrary()

// 打开包库面板
openBagLibrary()

// 关闭包库面板
closeBagLibrary()

// 选择包模型
selectBagModel(e)
```

### Three.js包生成技术

每种包都使用纯Three.js生成，没有外部模型文件：

#### 1. **经典圆形包** (`createClassicalBag`)
- 基础：`IcosahedronGeometry`（20面体）
- 材质：物理材质（PBR），带凹凸贴图
- 效果：带斑点的可爱球体

#### 2. **Q弹果冻包** (`createJellyBag`)
- 基础：`IcosahedronGeometry` + Perlin噪声变形
- 材质：玻璃材质，高透明度
- 效果：软弹的生物质感

#### 3. **刺猬包** (`createHedgehogBag`)
- 基础：球体 + 圆锥阵列
- 材质：主体 + 刺装饰
- 效果：全身密集的小刺

#### 4. **方块包** (`createCubeBag`)
- 基础：`BoxGeometry` + 球形参数化
- 材质：标准材质
- 效果：立方体与球体的混合

#### 5. **星形包** (`createStarBag`)
- 基础：球体 + 四面体凸起
- 材质：主体 + 凸起装饰
- 效果：多角星状外形

#### 6. **水果包** (`createFruitBag`)
- 基础：扁平球体 + 小球堆积 + 香蕉装饰
- 材质：橙色系渐变
- 效果：橙子表皮纹理

#### 7. **毛绒包** (`createFuzzyBag`)
- 基础：球体 + 毛发线段
- 材质：主体 + 毛发材质
- 效果：表面覆盖蓬松毛发

#### 8. **结晶包** (`createCrystalBag`)
- 基础：`DodecahedronGeometry`（12面体）+ 边线框
- 材质：玻璃材质 + 线框
- 效果：多面体水晶质感，带内部结构线条

#### 9. **火焰包** (`createFlameBag`)
- 基础：球体 + 圆锥火焰装饰
- 材质：主体 + 自发光火焰
- 效果：表面带有熊熊烈火

#### 10. **金属包** (`createMetalBag`)
- 基础：`IcosahedronGeometry` + 金属条纹
- 材质：金属材质（高金属度、低粗糙度）
- 效果：镜面反射的金属质感

## UI/UX设计

### 包库面板布局

```
┌─────────────────────────────┐
│  🎒 包库                    ✕ │
│  选择你喜欢的包样式         │
├─────────────────────────────┤
│ ┌──────────┐  ┌──────────┐ │
│ │ 🎪 预览  │  │ 🎨 预览  │ │
│ │ 经典包   │  │ 果冻包   │ │
│ │ 普通     │  │ 普通     │ │
│ └──────────┘  └──────────┘ │
│ ┌──────────┐  ┌──────────┐ │
│ │ 🎭 预览  │  │ 🏗️ 预览  │ │
│ │ 刺猬包   │  │ 方块包   │ │
│ │ 优秀     │  │ 优秀     │ │
│ └──────────┘  └──────────┘ │
│ ... 其他包                   │
└─────────────────────────────┘
```

### 样式特点

- **毛玻璃效果**：底部弹框采用深色毛玻璃设计
- **3D预览**：每个包都有实时3D预览（缩小版Canvas）
- **稀有度标签**：左上角显示包的稀有度等级
- **选中反馈**：选中的包有蓝青色发光边框和上浮效果
- **响应式网格**：2列网格布局，适应不同屏幕尺寸

## 深色模式适配

- ✅ 包库面板深色主题
- ✅ 文字高对比度（纯白/浅灰）
- ✅ 选中状态高亮（蓝青色）
- ✅ 稀有度标签配色调整

## 性能优化

### 内存管理

- 模型切换时自动清理旧模型的几何体和材质
- 使用材质克隆避免共享状态问题
- 预加载所有模型的创建函数（不预生成场景）

### 渲染优化

- 使用Canvas缩放预览（占用资源较少）
- 模型复用表情系统（眼睛、嘴巴等）
- 三角形数量平衡（20-6000三角形不等）

## 扩展指南

### 添加新包模型

1. **在 `bag_models.js` 中创建函数**
   ```javascript
   function createMyBag(THREE, materials) {
     const group = new THREE.Group();
     group.name = 'my_bag';
     // 创建几何体...
     group.bodyMesh = body;
     return group;
   }
   ```

2. **添加到 `BAG_MODELS` 表**
   ```javascript
   const BAG_MODELS = {
     // ...
     myBag: {
       id: 'myBag',
       name: '我的包',
       description: '自定义包模型',
       rarity: 'rare',
       creator: createMyBag
     }
   };
   ```

3. **导出函数**
   ```javascript
   module.exports = {
     BAG_MODELS,
     // ...
     createMyBag
   };
   ```

### 自定义包的表现力

- **形状变形**：使用Perlin噪声或数学函数
- **纹理效果**：通过几何体颜色和材质参数
- **动画**：在三.js的update循环中添加旋转/缩放
- **发光效果**：使用自发光材质和后处理特效

## 已知限制

1. **预览Canvas缩放**：预览使用单独的Canvas，可能与主Canvas同步有延迟
2. **三角形数量**：复杂包（如毛绒包）可能在低端设备上出现性能问题
3. **表情兼容性**：所有包共享相同的眼睛/嘴巴表情系统

## 未来改进方向

- [ ] 包库分类（按稀有度/类型）
- [ ] 包的动画预览（自动旋转）
- [ ] 包的收集成就系统
- [ ] 包的自定义颜色/纹理
- [ ] 通过云同步包的选择
- [ ] 包的抽卡系统（类似扭蛋）

## 测试清单

- ✅ 切换不同的包模型
- ✅ 表情显示（正常/受击/昏迷/暴击）
- ✅ 伤害飘字显示
- ✅ 页面重载后保持选择
- ✅ 深色/浅色模式适配
- ✅ 响应式布局
- ✅ 性能测试（帧率稳定）
- ✅ 内存泄漏检查

## 相关代码片段

### 在index.js中使用包库

```javascript
// 获取包列表
const bagModelList = this.bag3DRenderer.getBagModelList();

// 切换包
this.bag3DRenderer.changeBagModel('jelly');

// 获取当前包ID
const currentId = this.bag3DRenderer.currentBagModelId;

// 保存选择
wx.setStorageSync('selectedBagModel', currentId);

// 恢复选择
const savedId = wx.getStorageSync('selectedBagModel');
if (savedId) {
  this.bag3DRenderer.changeBagModel(savedId);
}
```

### 包的生成原理

```javascript
// 所有包都遵循这个模式
function createPackage(THREE, materials) {
  // 1. 创建Group容器
  const group = new THREE.Group();
  group.name = 'package_name';

  // 2. 创建主体
  const geometry = new THREE.SphereGeometry(...);
  const body = new THREE.Mesh(geometry, materials.bagBody);
  group.add(body);
  group.bodyMesh = body; // 保留引用供表情系统使用

  // 3. 添加装饰（可选）
  // 刺/毛发/火焰等...

  return group;
}
```
