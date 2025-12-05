# 受气包解压小程序

一款基于 UniApp + Vue3 + Pinia 开发的轻量级情绪宣泄趣味小程序。

## 🎮 功能特性

- ✅ **核心打击系统** - 点击反馈 + 动画 + 音效 + 震动
- ✅ **表情变化系统** - 根据连击数动态变化表情
- ✅ **伤害飘字特效** - 暴击提示和数值反馈
- ✅ **武器切换系统** - 拳头、拖鞋、平底锅三种武器
- ✅ **自定义换脸** - 上传照片替换受气包脸部
- ✅ **音效池方案** - 解决高频点击音效截断问题
- ✅ **连击系统** - Combo 计数和怒气槽
- ✅ **设置面板** - 音效/震动开关

## 📦 技术栈

- **前端框架**: UniApp + Vue 3
- **状态管理**: Pinia
- **样式方案**: SCSS
- **多媒体**: uni.createInnerAudioContext
- **后端**: 微信云开发 (待接入)

## 🚀 快速开始

### 1. 安装依赖

\`\`\`bash
npm install
# 或
pnpm install
\`\`\`

### 2. 运行项目

\`\`\`bash
# 微信小程序开发
npm run dev:mp-weixin

# H5 开发
npm run dev:h5
\`\`\`

### 3. 构建发布

\`\`\`bash
# 构建微信小程序
npm run build:mp-weixin

# 构建 H5
npm run build:h5
\`\`\`

## 📁 项目结构

\`\`\`
shouqibao/
├── components/          # Vue 组件
│   ├── BagSprite.vue   # 受气包核心组件
│   └── HitText.vue     # 伤害飘字组件
├── pages/              # 页面
│   └── index/          # 主页面
│       └── index.vue
├── store/              # 状态管理
│   ├── index.js        # Pinia 实例
│   └── game.js         # 游戏状态
├── utils/              # 工具类
│   └── AudioManager.js # 音效管理器
├── static/             # 静态资源
│   ├── images/         # 图片资源
│   └── audio/          # 音效文件
├── App.vue             # 全局入口
├── manifest.json       # UniApp 配置
├── pages.json          # 页面配置
└── package.json        # 依赖配置
\`\`\`

## 🎯 下一步开发计划

参考 `openspec/changes/2025-12-05-game-enhancement-features.md` 查看完整的功能增强提案：

- [ ] 新武器类型系统（15+ 种武器）
- [ ] 成就系统（30+ 成就）
- [ ] 好友对战功能
- [ ] 每日任务系统
- [ ] 音效自定义
- [ ] 皮肤商城

## 📄 文档

- [需求文档](./xuqiu.md)
- [原型设计](./yuanxing.md)
- [项目上下文](./openspec/project.md)
- [功能增强提案](./openspec/changes/2025-12-05-game-enhancement-features.md)

## ⚠️ 注意事项

1. **音频文件**: 需要在 `static/audio/` 目录下放置音效文件（punch.mp3, slap.mp3, pan.mp3）
2. **微信小程序**: 需在 `manifest.json` 中填写正确的 AppID
3. **云开发**: 如需使用排行榜等功能，需开通微信云开发

## 📝 开发日志

- 2025-12-05: 完成基础框架搭建
- 2025-12-05: 实现核心打击系统
- 2025-12-05: 创建功能增强提案

## 📮 联系方式

如有问题或建议，欢迎提 Issue！
\`\`\`
