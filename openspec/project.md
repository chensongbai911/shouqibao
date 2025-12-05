# Project Context

## Purpose
**项目名称：** 受气包 (Venting Bag) - 解压微信小程序

**核心目标：**
- 开发一款轻量级、即开即用的情绪宣泄工具
- 通过简单的点击交互，提供瞬间的"爽感"和心理慰藉
- 采用"丑萌"画风和搞怪反馈，将负面情绪转化为娱乐体验
- 符合微信小程序"用完即走"的理念

**目标用户：**
- 加班的社畜（工作压力大）
- 考试的学生（需要情绪宣泄）
- 情绪焦虑者（需要简单的释放工具）
- 休闲玩家（打发时间）

## Tech Stack

### 前端框架
- **微信小程序原生开发 (Native)**
  - WXML（页面结构）
  - WXSS（样式布局，支持 rpx 自适应单位）
  - JavaScript (ES6+)（业务逻辑）

### 后端服务
- **微信云开发 (CloudBase)**
  - Serverless 模式
  - 云数据库（存储用户数据、排行榜）
  - 云函数（updateScore, getRanking）

### 核心技术
- **动画方案：** CSS3 Keyframes（高性能，不占用 JS 线程）
- **音频处理：** wx.createInnerAudioContext（支持多实例并发播放）
- **触感反馈：** wx.vibrateShort（调用手机线性马达）

### 开发工具
- 微信开发者工具（官方 IDE）
- 微信小程序账号（个人主体）

## Project Conventions

### Code Style

**命名规范：**
- 文件名：小写字母 + 下划线（如 `audio_manager.js`, `bag_normal.png`）
- 变量名：驼峰命名法（如 `currentWeapon`, `damageTexts`）
- 常量名：全大写 + 下划线（如 `MAX_COMBO`）
- 类名：帕斯卡命名法（如 `AudioPool`）

**代码组织：**
- 页面逻辑优先使用 Page() 生命周期
- 工具类封装在 `/utils` 目录
- 静态资源分类存放（`/images`, `/audio`）

**注释规范：**
- 关键函数必须添加 JSDoc 注释
- 复杂逻辑需要行内注释说明

### Architecture Patterns

**目录结构：**
```
shouqibao-miniprogram/
├── cloudfunctions/       # 云函数
│   ├── updateScore/
│   └── getRanking/
├── miniprogram/          # 小程序主目录
│   ├── images/           # 图片资源
│   ├── audio/            # 音频资源
│   ├── pages/            # 页面
│   │   └── index/
│   ├── utils/            # 工具类
│   └── app.js/json/wxss
```

**核心设计模式：**
- **音频池模式：** 预加载多个音频实例，轮询播放，避免音效截断
- **状态机模式：** 受气包状态切换（Idle → Hit → Recover）
- **事件驱动：** 基于 `bindtap` 事件触发反馈链（视觉+听觉+触觉）

**性能优化原则：**
- 使用 CSS 动画替代 JS 动画
- 避免频繁 `setData`，合并数据更新
- 图片资源压缩（PNG 透明底，尺寸 512x512px 以内）
- 音频文件时长控制在 1 秒以内

### Testing Strategy

**MVP 阶段（第一版）：**
- 手动测试为主
- 核心测试点：
  - 点击响应速度（目标 < 100ms）
  - 音效并发播放（连续快速点击不丢音）
  - 震动反馈强度（type: 'heavy'）
  - 飘字动画流畅度

**后续迭代：**
- 真机测试（iOS/Android 各 2 款）
- 边界测试（极限点击速度、内存占用）

### Git Workflow

**分支策略：**
- `main`：生产环境代码
- `dev`：开发分支
- `feature/*`：功能分支（如 `feature/weapon-system`）

**提交规范：**
- `feat: 新功能描述`
- `fix: 修复问题描述`
- `style: 样式调整描述`
- `refactor: 重构描述`

## Domain Context

### 游戏机制核心概念

**三重反馈系统（打击感核心）：**
1. **视觉反馈：** 受击动画（shake）+ 图片切换 + 飘字特效
2. **听觉反馈：** 随机播放 3 种打击音效
3. **触觉反馈：** 手机震动（wx.vibrateShort）

**状态机逻辑：**
- **Idle（待机）：** 执行浮动动画，挑衅表情
- **Hit（受击）：** 图片切换为痛苦表情，执行抖动动画
- **Recover（恢复）：** 500ms 无操作后回到 Idle
- **Taunt（嘲讽）：** 5 秒无操作触发语音彩蛋

**功能优先级（MVP 原则）：**
- **P0（核心）：** 点击反馈、视觉反馈、数值系统
- **P1（重要）：** 道具系统、简单换脸
- **P2（增强）：** 排行榜、彩蛋

### UI 设计风格

**色彩方案：**
- 主色调：橙红 #FF6B35、明黄 #FFD23F
- 强调色：红色 #FF0000（伤害飘字）
- 背景：渐变（#FFD23F → #FF6B35）

**画风定位：**
- 丑萌（Ugly-cute）、手绘、涂鸦感
- 参考：暴走漫画、Line 贴图馒头人、Fall Guys 豆子人

## Important Constraints

### 技术限制
- **包体积：** 微信小程序主包 ≤ 2MB（需压缩图片和音频）
- **音频格式：** 仅支持 mp3/aac（推荐 mp3）
- **图片格式：** PNG/JPG（透明背景必须用 PNG）
- **云开发免费额度：**
  - 数据库读操作：50,000 次/天
  - 数据库写操作：30,000 次/天
  - 云存储：5GB

### 性能要求
- 点击响应延迟 < 100ms
- 动画帧率 ≥ 30fps
- 首屏加载时间 < 2s

### 兼容性
- 支持微信版本 ≥ 7.0.0
- 适配机型：iOS 12+ / Android 6.0+
- 屏幕适配：使用 rpx 单位（750rpx = 屏幕宽度）

## External Dependencies

### 微信官方 API
- `wx.vibrateShort()`：震动反馈
- `wx.createInnerAudioContext()`：音频播放
- `wx.chooseImage()`：换脸功能（相册选择）
- `wx.cloud.database()`：云数据库操作
- `wx.cloud.callFunction()`：调用云函数

### 第三方资源
- **音效素材：**
  - 爱给网 (aigei.com)
  - Freesound.org
- **图标库：**
  - 阿里巴巴矢量图标库 (iconfont.cn)
  - Flaticon.com
- **AI 绘画工具（设计参考）：**
  - Midjourney
  - Stable Diffusion
  - 文心一格

### 云服务依赖
- **微信云开发环境：** 需在开发者工具中开通并关联
- **云数据库集合：**
  - `users`：字段 `{_openid, score, updateTime}`
- **云函数：**
  - `updateScore`：更新用户分数
  - `getRanking`：获取排行榜（按 score 降序）

## Development Roadmap

### 第一阶段：MVP 核心体验（2天）
- 基础布局 + 点击反馈
- 震动 + 音效集成
- 简单计分系统

### 第二阶段：功能完善（2天）
- 伤害飘字特效
- 武器切换系统
- 换脸功能
- 彩蛋逻辑

### 第三阶段：云端对接（1天）
- 云开发环境配置
- 数据持久化
- 排行榜实现
