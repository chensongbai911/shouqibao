# Project Context

## Purpose
**受气包解压小程序** - 一款轻量级情绪宣泄趣味小程序

### 核心目标
- **情绪宣泄**：为职场人、学生等提供即开即用的压力释放工具
- **趣味互动**：通过高频点击、视觉反馈、听觉刺激提供瞬间爽感
- **娱乐体验**：用丑萌画风和搞怪反馈将负面情绪转化为娱乐

### 目标用户
- 加班的社畜：想宣泄但需要安全出口
- 考试的学生：被题目折磨需要发泄
- 无聊的网友：寻找解压娱乐方式

## Tech Stack

### 前端框架
- **UniApp (基于 Vue.js)**
  - 跨平台支持（微信小程序、抖音小程序等）
  - 一套代码多端发布
  - Vue 语法，上手快

### 编程语言
- **JavaScript** - 快速开发 MVP

### UI 样式
- **CSS3 / SCSS**
  - CSS Keyframes 实现抖动、缩放动画
  - 高饱和度暖色调（橙红、明黄）
  - 手绘、丑萌、夸张风格

### 后端服务
- **微信云开发 (CloudBase)**
  - Serverless 模式，免服务器运维
  - 云函数 + 云数据库
  - 适合个人开发者

### 多媒体处理
- **uni.createInnerAudioContext** - 音效并发播放
- **uni.vibrateShort** - 触感反馈（线性马达）

### 状态管理
- **Pinia / Vuex** - 管理分数、武器、音效设置等全局状态

## Project Conventions

### 代码风格
- **组件命名**：PascalCase（如 `BagSprite.vue`、`HitText.vue`）
- **变量命名**：camelCase（如 `currentScore`、`bagState`）
- **常量命名**：UPPER_SNAKE_CASE（如 `MAX_COMBO_COUNT`）
- **CSS类名**：kebab-case（如 `.is-hit`、`.damage-text`）
- **缩进**：2 空格
- **单引号** 优于双引号

### 架构模式

#### 目录结构
```
project-root
├── cloudfunctions/       # 云函数（获取 OpenID、排行榜）
├── static/               # 静态资源
│   ├── images/          # 受气包表情图（normal.png, hit.png, dizzy.png）
│   └── audio/           # 音效文件（punch.mp3, slap.mp3, scream.mp3）
├── components/          # Vue 组件
│   ├── BagSprite.vue    # 核心：受气包组件
│   ├── HitText.vue      # 特效：伤害飘字
│   └── WeaponPanel.vue  # UI：武器选择面板
├── pages/
│   └── index/
│       └── index.vue    # 主页面
├── store/               # 状态管理
│   └── index.js         # 全局状态
└── App.vue              # 全局入口
```

#### 组件设计原则
- **BagSprite.vue** - 单一职责：负责受气包视觉反馈和状态机
- **HitText.vue** - 可复用：伤害数字飘字动画
- **WeaponPanel.vue** - 独立：武器选择逻辑封装

#### 状态机设计
受气包状态：`idle` → `hit` → `dizzy` → `idle`
```javascript
const bagState = ref('idle'); // 'idle' | 'hit' | 'dizzy'
```

### 性能优化策略

#### 动画实现
- **优先使用 CSS Class 切换**，而非 JS 动画（性能最佳）
- 使用 `transform` 和 `opacity`（触发 GPU 加速）
- 避免频繁操作 DOM

#### 音效池方案
- 创建 5-10 个 `InnerAudioContext` 实例
- 轮流使用，避免音效被截断
- 支持高频点击时的并发播放

#### 防抖与节流
- 点击事件使用防抖避免过度触发
- 云函数调用使用节流限制频率

### 测试策略
- **真机测试重点**：
  - iOS 音频播放策略兼容性
  - 安卓震动反馈效果
  - 不同屏幕尺寸适配
- **性能测试**：
  - 连续 100 次点击流畅度
  - 内存占用监控
  - 动画帧率保持 60fps

### Git 工作流
- **分支策略**：
  - `main` - 生产环境
  - `dev` - 开发环境
  - `feature/*` - 功能开发
- **提交规范**：
  - `feat:` 新功能
  - `fix:` 修复 bug
  - `style:` UI 样式调整
  - `perf:` 性能优化
  - `refactor:` 重构

## Domain Context

### 功能优先级

| 优先级 | 功能模块 | 说明 |
|--------|----------|------|
| **P0** | 打击核心 | 点击反馈：动画 + 音效 + 震动 |
| **P0** | 视觉反馈 | 表情变化（根据连击数） |
| **P0** | 数值系统 | 伤害飘字 + 累计分数 |
| **P1** | 道具系统 | 武器切换（拳头/拖鞋/平底锅） |
| **P1** | 自定义 | DIY 换脸功能 |
| **P2** | 社交 | 排行榜（今日解压榜） |
| **P2** | 互动 | 吐槽弹幕 |

### 交互细节
1. **待机状态**：受气包上下浮动，表情挑衅
2. **点击状态**：缩小 + 抖动 + 震动 + 音效
3. **恢复状态**：2 秒后恢复，弹出气泡"就这点力气？"

### UI 布局规范
- **顶部栏**：设置按钮 | 血条/怒气槽 | 累计分数
- **中央舞台**：受气包（占屏 50%）+ 特效层
- **底部操作栏**：武器库 | 换脸 | 排行榜

## Important Constraints

### 技术限制
- **微信小程序包大小**：主包 ≤ 2MB，总包 ≤ 20MB
- **云开发免费额度**：
  - 数据库读写：5万次/天
  - 云存储：5GB
  - 云函数调用：10万次/月

### 性能要求
- **首屏加载**：< 2 秒
- **点击响应**：< 100ms
- **动画帧率**：≥ 60fps

### 用户体验
- **音效开关**：必须可控（避免公共场合尴尬）
- **震动开关**：可选（部分用户不喜欢）
- **无需登录**：即开即用，降低使用门槛

## External Dependencies

### 微信小程序 API
- `uni.createInnerAudioContext()` - 音频播放
- `uni.vibrateShort()` - 短震动
- `uni.chooseImage()` - 选择图片（换脸功能）
- `uni.getStorageSync()` - 本地存储

### 云开发服务
- **云数据库**：存储用户分数、排行榜数据
- **云函数**：
  - `getUserOpenID` - 获取用户唯一标识
  - `updateRanking` - 更新排行榜
  - `getRankList` - 获取排行榜数据
- **云存储**：存储用户上传的换脸图片

### 可能的扩展
- **广告 SDK**（变现）：微信小程序广告组件
- **数据分析**：微信小程序数据助手
- **分享 API**：`uni.shareAppMessage()` - 分享到聊天
