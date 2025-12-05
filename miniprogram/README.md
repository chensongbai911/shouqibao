# 受气包小程序 - 开发指南

## 项目介绍

这是一款轻量级的解压微信小程序，用户通过点击屏幕上的"受气包"来宣泄情绪，获得瞬间的"爽感"。

## 已完成功能（第一阶段 MVP）

✅ **核心交互**
- 点击受气包触发三重反馈（视觉+听觉+触觉）
- 抖动动画效果
- 手机震动反馈（重度震动）

✅ **伤害飘字特效**
- 从点击位置向上飘动的伤害数字
- 10% 概率触发暴击效果（2倍伤害，特殊动画）
- 随机偏移避免飘字重叠
- 流畅的 CSS3 动画

✅ **计分系统**
- 实时显示总伤害
- 本地存储持久化（重启应用保持分数）
- 重置功能

✅ **音频系统**
- 音频池模式，支持快速连续点击不丢音
- 3个音频实例轮询播放

## 快速开始

### 1. 安装微信开发者工具

下载地址：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

### 2. 准备资源文件

#### 必需资源
在正式运行前，需要准备以下资源：

**图片资源：**
- `images/bag_normal.png` - 受气包图片（512x512px PNG）

**音频资源：**
- `audio/hit.mp3` - 打击音效（< 1秒 MP3）

#### 临时方案
如果暂时没有资源，可以：
1. 使用占位符图片（纯色或 emoji）
2. 注释掉音频相关代码（`index.js` 第 18-19 行）

### 3. 导入项目

1. 打开微信开发者工具
2. 选择"导入项目"
3. 项目目录选择：`d:\shouqibao\miniprogram`
4. AppID 选择"测试号"或使用自己的 AppID
5. 点击"导入"

### 4. 运行项目

- 点击"编译"按钮即可在模拟器中预览
- 点击"真机调试"在手机上测试（推荐，体验震动和音效）

## 项目结构

```
miniprogram/
├── app.js              # 小程序入口逻辑
├── app.json            # 全局配置
├── app.wxss            # 全局样式
├── project.config.json # 项目配置
├── sitemap.json        # 索引配置
├── pages/
│   └── index/          # 首页
│       ├── index.js    # 页面逻辑（核心功能）
│       ├── index.wxml  # 页面结构
│       ├── index.wxss  # 页面样式
│       └── index.json  # 页面配置
├── utils/
│   └── audio_pool.js   # 音频池工具类
├── images/             # 图片资源目录
│   └── README.md       # 图片使用说明
└── audio/              # 音频资源目录
    └── README.md       # 音频使用说明
```

## 核心技术实现

### 三重反馈系统

```javascript
onBagTap(e) {
  // 1. 视觉反馈：抖动动画 + 伤害飘字
  this.showHitAnimation();
  this.showDamageText(damage, position);

  // 2. 听觉反馈：打击音效
  this.playHitSound();

  // 3. 触觉反馈：手机震动
  this.vibratePhone();
}
```

### 音频池模式

使用多个音频实例轮询播放，避免快速点击时音效截断：

```javascript
const AudioPool = require('../../utils/audio_pool.js');
this.audioPool = new AudioPool('/audio/hit.mp3', 3); // 3个实例
```

### 伤害飘字特效

使用 CSS3 动画实现高性能的飘字效果：

```css
@keyframes floatUp {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-100rpx); opacity: 0; }
}
```

## 性能优化

1. ✅ **CSS 动画替代 JS 动画** - 利用 GPU 加速
2. ✅ **音频池预加载** - 避免每次点击重新创建实例
3. ✅ **防止内存泄漏** - 800ms 后自动清理飘字
4. ✅ **本地存储** - 减少频繁的数据读写

## 下一步计划（第二阶段）

根据 OpenSpec 提案，接下来将实现：

- [ ] 武器切换系统（001-weapon-system.md）
- [ ] 换脸功能（004-face-swap.md）
- [ ] 彩蛋系统（005-easter-eggs.md）

## 常见问题

### Q: 没有图片资源怎么办？
A: 暂时可以使用纯色占位符，或访问 [爱给网](https://www.aigei.com/) 下载免费素材。

### Q: 真机上没有震动？
A: 检查手机是否开启震动功能，部分机型不支持 `type: 'heavy'` 参数。

### Q: 音效不播放？
A: 确保 `audio/hit.mp3` 文件存在，或暂时注释掉音频相关代码。

### Q: 如何修改伤害值？
A: 修改 `pages/index/index.js` 的 `currentDamage` 值（第 9 行）。

## 开发建议

1. **优先真机测试** - 模拟器无法体验震动和完整音效
2. **资源压缩** - 保持包体积 < 2MB
3. **性能监控** - 使用开发者工具的性能面板
4. **用户反馈** - 根据实际体验调整震动强度和音效

## 技术支持

- 微信小程序官方文档：https://developers.weixin.qq.com/miniprogram/dev/framework/
- 项目提案文档：`openspec/changes/`

## 许可证

MIT License
