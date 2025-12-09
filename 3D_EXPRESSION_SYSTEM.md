# 3D 受气包系统升级说明

## 概述

使用 Three.js 替代原有的图片表情系统，实现更动态、更流畅的 3D 受气包效果。

## 技术方案

### 1. Three.js 微信小程序适配

使用 `threejs-miniprogram` 适配库，这是微信官方提供的 Three.js 移植版本。

**安装方式：**
```bash
npm install --save threejs-miniprogram
```

**参考文档：**
- GitHub: https://github.com/wechat-miniprogram/threejs-miniprogram
- 示例: https://github.com/wechat-miniprogram/miniprogram-demo

### 2. 文件结构

```
miniprogram/
├── utils/
│   └── bag_3d.js           # 3D受气包渲染器类
├── pages/
│   └── index/
│       ├── index.js        # 页面逻辑（已集成3D系统）
│       ├── index.wxml      # 页面结构（已添加canvas）
│       └── index.wxss      # 页面样式（已添加3D样式）
```

### 3. 核心功能

#### Bag3DRenderer 类

**主要方法：**
- `init()`: 初始化 Three.js 场景、相机、渲染器
- `createBagModel()`: 创建 3D 受气包模型（球体+眼睛+嘴巴）
- `changeExpression(expression)`: 切换表情状态
  - `normal`: 正常表情（微笑）
  - `hit`: 受击表情（闭眼+O形嘴）
  - `crit`: 暴击表情（X形眼+夸张嘴）
  - `dizzy`: 晕眩表情（螺旋眼+歪嘴）
- `hitAnimation(isCrit)`: 受击动画（压扁回弹效果）
- `animate()`: 渲染循环（自动平滑过渡）
- `dispose()`: 清理资源

#### 表情系统

**动态表情变化：**
- 眼睛：通过缩放、旋转实现不同状态（睁眼/闭眼/X形/螺旋）
- 嘴巴：通过 EllipseCurve 动态生成不同形状（微笑/O形/波浪）
- 整体：支持压扁、旋转等物理变形

**动画效果：**
- 受击压扁：根据暴击与否调整压扁幅度（0.3-0.5）
- 平滑过渡：所有动画使用缓动函数，自动回弹
- 随机旋转：受击时随机旋转方向，增加真实感

### 4. 优势

相比图片方案：
- ✅ 包体积更小（无需4张表情图片）
- ✅ 动画更流畅（60fps 实时渲染）
- ✅ 效果更丰富（支持任意变形、旋转）
- ✅ 可扩展性强（易于添加新表情、新动画）
- ✅ 性能优化（GPU 加速渲染）

### 5. 集成步骤

已完成的改动：

1. **创建 3D 渲染器**
   - 文件：`miniprogram/utils/bag_3d.js`
   - 功能：Three.js 场景管理、模型创建、动画控制

2. **修改页面结构**
   - 文件：`miniprogram/pages/index/index.wxml`
   - 改动：将图片层替换为 WebGL Canvas

3. **更新页面逻辑**
   - 文件：`miniprogram/pages/index/index.js`
   - 改动：
     - 引入 `bag_3d.js` 和 `threejs-miniprogram`
     - 添加 `init3DRenderer()` 方法
     - 更新 `changeBagExpression()` 调用 3D 接口
     - 更新 `showHitAnimation()` 调用 3D 接口
     - 在 `onUnload()` 中清理 3D 资源

4. **添加样式**
   - 文件：`miniprogram/pages/index/index.wxss`
   - 改动：添加 `.bag-3d-canvas` 样式

## 使用说明

### 开发环境配置

1. 安装依赖：
```bash
cd miniprogram
npm install
```

2. 微信开发者工具配置：
   - 打开「工具」→「构建 npm」
   - 勾选「使用 npm 模块」

### 测试要点

- [ ] 点击受气包，观察表情切换是否流畅
- [ ] 暴击时的 X 形眼睛效果
- [ ] 受击压扁回弹动画
- [ ] 晕眩状态的螺旋眼和歪嘴
- [ ] 页面切换时资源是否正确释放

## 后续优化方向

1. **自定义头像适配**：将用户上传的头像贴图映射到 3D 模型
2. **更多表情**：添加更多情绪状态（愤怒、哭泣等）
3. **粒子特效**：在 3D 场景中添加粒子系统
4. **交互增强**：支持拖拽旋转查看不同角度
5. **性能优化**：根据设备性能动态调整渲染质量

## 注意事项

⚠️ **重要提醒：**
- 确保已安装 `threejs-miniprogram` npm 包
- 在微信开发者工具中执行「构建 npm」
- Canvas 需要设置 `type="webgl"` 才能使用 Three.js
- 低端设备可能需要降低渲染分辨率

## 技术支持

如遇问题，请参考：
- Three.js 官方文档: https://threejs.org/docs/
- 微信小程序 Three.js 适配库: https://github.com/wechat-miniprogram/threejs-miniprogram
