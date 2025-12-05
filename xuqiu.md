# "受气包"解压微信小程序 - 完整产品与技术方案文档 (PRD)

**项目名称：** 受气包 (Venting Bag)
**文档版本：** V1.0. 0
**技术栈：** 微信小程序原生开发 (WXML/WXSS/JS) + 微信云开发 (CloudBase)
**更新日期：** 2025-12-05
**文档作者：** chensongbai911

---

## 目录 (Table of Contents)

1.  [项目概述](#1-项目概述)
2. [技术选型](#2-技术选型)
3. [需求分析与功能列表](#3-需求分析与功能列表)
4. [产品原型与UI设计](#4-产品原型与ui设计)
5. [技术架构与目录结构](#5-技术架构与目录结构)
6. [核心代码逻辑方案](#6-核心代码逻辑方案)
7. [开发实施规划](#7-开发实施规划)
8. [资源需求清单](#8-资源需求清单)
9. [UI设计图生成指南](#9-ui设计图生成指南)

---

## 1. 项目概述 (Project Overview)

### 1.1 项目背景

现代生活节奏快，职场人与学生群体普遍面临精神压力。市场上缺乏一款轻量级、即开即用、纯粹用于宣泄负面情绪的趣味工具。本项目旨在开发一款"随手发泄"的微信小程序，通过简单的交互提供心理慰藉。

### 1.2 核心价值

*   **情绪宣泄**：通过高频点击、视觉反馈、听觉刺激，提供瞬间的"爽感"。
*   **趣味互动**：采用"丑萌"画风和搞怪反馈，将负面情绪转化为娱乐体验。
*   **极简体验**：无复杂逻辑，打开即玩，用完即走，符合微信小程序"用完即走"的理念。

### 1.3 目标用户

*   **加班的社畜**：工作压力大，想象着揍老板但不敢动手。
*   **考试的学生**：被题目折磨，需要情绪宣泄出口。
*   **情绪焦虑者**：需要一个简单的情绪释放工具。
*   **无聊的网友**：单纯想找点东西狂点打发时间。

---

## 2. 技术选型 (Technology Stack)

基于性能优化和原生体验考虑，采用纯原生开发模式：

| 模块 | 选型方案 | 选择理由 |
| :--- | :--- | :--- |
| **前端框架** | **原生小程序 (Native)** | **WXML/WXSS/JS**。无跨端需求，原生开发包体积最小，API 调用延迟最低，动画性能最好。 |
| **编程语言** | **JavaScript (ES6+)** | 原生 JS，配合微信小程序 API，运行效率最高。 |
| **页面结构** | **WXML** | 微信原生标记语言，结构清晰，类似 HTML。 |
| **样式布局** | **WXSS** | 类似 CSS，支持 rpx 自适应单位，方便适配不同手机屏幕。 |
| **后端服务** | **微信云开发 (CloudBase)** | **Serverless 模式**。免服务器运维，免费额度够用，前端直接操作数据库，极适合个人开发者。 |
| **动画方案** | **CSS3 Keyframes** | 相比 JS 动画更流畅，不占用 JS 线程，适合高频触发场景（每秒可能10+次点击）。 |
| **音频处理** | **wx.createInnerAudioContext** | 支持多实例并发播放，解决快速点击时的音效吞音问题。 |
| **触感反馈** | **wx. vibrateShort** | 调用手机线性马达，提供物理打击感（核心体验要素）。 |
| **数据存储** | **云数据库 (Cloud DB)** | 存储用户 OpenID、最高分数、排行榜数据。 |

---

## 3. 需求分析与功能列表 (Requirements Analysis)

### 3.1 用户画像
*   **职场人士**：想揍老板但不敢动手，通过虚拟发泄释放压力。
*   **学生群体**：被题目折磨，需要发泄。
*   **情绪焦虑者**：需要一个简单的情绪释放工具。
*   **休闲玩家**：单纯想找点东西狂点打发时间。

### 3.2 功能优先级 (Feature List)

我们遵循 **MVP (Minimum Viable Product, 最小可行性产品)** 原则，先做核心功能。

| 优先级 | 模块名称 | 功能点 | 详细描述 | 技术要点 |
| :--- | :--- | :--- | :--- | :--- |
| **P0 (核心)** | **打击核心** | **点击反馈** | 点击屏幕任意位置或受气包区域，触发受击动画 + 播放随机音效 + 手机短震动。 | `bindtap` 事件、CSS class 动态切换、`wx.vibrateShort` |
| **P0 (核心)** | **视觉反馈** | **状态切换** | 根据连击数/血量，受气包在 [待机]、[受击]、[残血/哭泣] 三种状态间切换图片。 | 状态机逻辑、`data. imgSrc` 动态绑定 |
| **P0 (核心)** | **数值系统** | **伤害飘字** | 每次点击，点击位置弹出 "-1"、"暴击!" 等动态文字，顶部积分增加。 | 绝对定位 + CSS 动画、临时节点生成与销毁 |
| **P1** | **道具系统** | **武器切换** | 底部提供 [拳头]、[拖鞋]、[平底锅] 切换，改变点击音效和光标样式。 | 全局变量 `currentWeapon`、音频池管理 |
| **P1** | **自定义** | **简单的换脸** | 用户可从相册选择一张图片，裁切成圆形遮罩，覆盖在受气包面部。 | `wx.chooseImage`、`<canvas>` 或 `<image>` 层级覆盖 |
| **P2** | **排行榜** | **云端排行** | 基于云开发的"今日解压榜" (按点击总次数排名)。 | 云数据库查询、`orderBy` 排序 |
| **P2** | **彩蛋** | **语音嘲讽** | 当用户停止点击超过 5 秒，播放一句嘲讽语音（如"没劲儿"）。 | `setTimeout` 计时器 + 音频播放 |

---

## 4. 产品原型与UI设计 (Prototype Design)

### 4.1 整体UI风格定义

*   **色调**：高饱和度暖色（橙红 #FF6B35、明黄 #FFD23F），激发活跃情绪。
*   **画风**：手绘、丑萌（Ugly-cute）、夸张线条、涂鸦感（类似暴走漫画风格）。
*   **字体**：粗黑体，带有冲击力（如"思源黑体 Heavy"）。

### 4.2 页面布局线框图 (Wireframe)

本项目为单页应用，核心页面结构如下：

```text
+---------------------------------------+
|  [状态栏 9:41]               (...)    |  <-- 微信自带，不可控
+---------------------------------------+
|  💥 得分: 9999             [设置⚙️]    |  <-- 顶部栏 (Flex布局: space-between)
|                                       |
|  [========怒气值/血条进度=========]    |  <-- <progress> 组件，颜色渐变
+---------------------------------------+
|                                       |
|          ( 🔥 暴击 x 5!  )              |  <-- 绝对定位的特效层 (z-index: 100)
|                                       |      条件渲染 wx:if="{{combo > 3}}"
|                                       |
|            /  --  \                   |
|          /  >    <  \                 |
|         |     O      |                |  <-- <image> 受气包本体
|          \  ~~~~~~  /                 |      src="{{bagImage}}"
|            \      /                   |      class="bag-img {{animClass}}"
|                                       |      bindtap="onHit"
|                                       |
|      ( 💬 气泡："再大力点！" )          |  <-- 随机显示的 <view>
|                                       |      wx:if="{{showBubble}}"
|                                       |
+---------------------------------------+
|                                       |
|   [ 🥊 ]      [ 📸 ]      [ 🏆 ]     |  <-- 底部 Dock 栏 (position: fixed)
|   武器库       换脸        排行榜       |      bottom: 30rpx
|                                       |
+---------------------------------------+
```

### 4.3 关键交互逻辑细节

#### 交互 1：待机状态 (Idle)
*   **视觉**：受气包图片执行 `transform: translateY` 的缓动动画，上下浮动 10rpx，模拟呼吸/挑衅。
*   **表情**：贱贱的坏笑，或者翻白眼，眼神充满挑衅。
*   **CSS 实现**：
```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
}
.bag-idle {
  animation: float 2s ease-in-out infinite;
}
```

#### 交互 2：受击状态 (Hit)
*   **触发**：用户点击屏幕 (`bindtap="onHit"`)。
*   **视觉**：
    *   添加 `. shake` 类（执行 0.1s 抖动动画）。
    *   图片瞬间切换为"受击图"（眼睛变成 X，嘴巴张大）。
*   **触觉**：调用 `wx.vibrateShort({type: 'heavy'})`。
*   **听觉**：从音效池播放 `hit.mp3`（随机选择 3 种音效之一）。
*   **飘字**：在点击坐标 `(e.detail.x, e.detail.y)` 生成临时 `<view>` 节点，内容为 "-1"，执行向上飘动并淡出的 CSS 动画，1秒后销毁。

#### 交互 3：恢复状态 (Recover)
*   **触发**：设置防抖定时器，若 500ms 无操作。
*   **视觉**：图片切回"待机图"，表情变回挑衅。
*   **彩蛋**：如果超过 5 秒无操作，弹出气泡："就这点力气？"，并播放嘲讽音频。

### 4.4 受气包形象设计需求（给设计师的描述）

如果您需要找设计师或自己绘制，请参考以下描述：

1.  **待机状态 (Idle)**
    *   **外观**：圆形或椭圆形身体，像个沙袋。
    *   **表情**：贱贱的坏笑，或者翻白眼，一副"来打我呀"的挑衅表情。
    *   **颜色**：明黄色或肉色，轮廓线粗黑。
2.  **受击状态 (Hit)**
    *   **表情**：眼睛变成"X"或"螺旋"，嘴巴张大成"O"，脸部扭曲变形（一边扁一边鼓）。
    *   **特效**：周围要有类似漫画的"爆炸线"或者飞溅的汗珠、星星。
3.  **残血/受伤状态 (Damaged)**
    *   **外观**：脸上贴着创可贴，一只眼睛肿了（画成紫色），流着鼻涕或眼泪。
    *   **表情**：哭泣或彻底认怂的表情，但眼神依然倔强（可选）。

---

## 5. 技术架构与目录结构 (Technical Architecture)

### 5.1 项目目录结构 (Native Standard)

```text
shouqibao-miniprogram/
├── cloudfunctions/       # 云函数目录（需在微信开发者工具中关联云环境）
│   ├── updateScore/      # 云函数：更新用户分数
│   │   ├── index.js      # 主逻辑
│   │   └── package.json
│   └── getRanking/       # 云函数：获取排行榜
│       ├── index.js
│       └── package.json
├── miniprogram/          # 小程序主目录
│   ├── images/           # 静态图片资源
│   │   ├── bag_normal.png    # 受气包-正常
│   │   ├── bag_hit.png       # 受气包-受击
│   │   ├── bag_cry.png       # 受气包-哭泣
│   │   ├── weapon_fist.png   # 武器-拳头
│   │   ├── weapon_slipper.png # 武器-拖鞋
│   │   └── weapon_pan.png    # 武器-平底锅
│   ├── audio/            # 音频资源
│   │   ├── hit1.mp3      # 打击音效1
│   │   ├── hit2.mp3      # 打击音效2
│   │   ├── hit3.mp3      # 打击音效3
│   │   └── taunt.mp3     # 嘲讽语音
│   ├── pages/
│   │   └── index/        # 主页面
│   │       ├── index.wxml    # 页面结构
│   │       ├── index.wxss    # 页面样式（含动画）
│   │       ├── index.js      # 页面逻辑
│   │       └── index.json    # 页面配置
│   ├── utils/
│   │   └── audioManager.js   # 音效池管理工具类
│   ├── app. json          # 全局配置
│   ├── app.wxss          # 全局样式
│   └── app.js            # 全局逻辑（初始化云环境）
└── project.config.json   # 项目配置文件
```

### 5. 2 关键配置文件

#### app.json（全局配置）
```json
{
  "pages": [
    "pages/index/index"
  ],
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#FF6B35",
    "navigationBarTitleText": "受气包",
    "navigationBarTextStyle": "white"
  },
  "sitemapLocation": "sitemap. json",
  "cloud": true
}
```

---

## 6. 核心代码逻辑方案 (Core Logic)

### 6.1 动画实现方案 (WXSS)

使用 **CSS Animation** 实现高性能动画，避免频繁 `setData` 导致卡顿。

```css
/* pages/index/index.wxss */

/* 待机浮动动画 */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
}

/* 受击抖动动画 */
@keyframes shake {
  0% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(0.9) rotate(5deg); }
  50% { transform: scale(0.95) rotate(-5deg); }
  75% { transform: scale(0.9) rotate(3deg); }
  100% { transform: scale(1) rotate(0deg); }
}

/* 伤害飘字动画 */
@keyframes float-up {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(-100rpx);
    opacity: 0;
  }
}

. bag-container {
  width: 500rpx;
  height: 500rpx;
  margin: 100rpx auto;
  position: relative;
}

.bag-img {
  width: 100%;
  height: 100%;
  transition: transform 0.1s;
}

.bag-idle {
  animation: float 2s ease-in-out infinite;
}

.is-hit {
  animation: shake 0.1s ease-in-out;
}

.damage-text {
  position: absolute;
  font-size: 48rpx;
  font-weight: bold;
  color: #FF0000;
  animation: float-up 1s ease-out forwards;
  pointer-events: none;
}
```

### 6.2 音效池逻辑 (audioManager.js)

**问题**：`InnerAudioContext` 若在前一个音效未播完时再次 `play()`，会导致声音截断。
**方案**：预加载多个音频实例，轮询播放，实现音效并发。

```javascript
// utils/audioManager.js

class AudioPool {
  constructor(src, size = 5) {
    this.pool = [];
    this.currentIndex = 0;

    // 创建音频池
    for (let i = 0; i < size; i++) {
      const ctx = wx. createInnerAudioContext();
      ctx.src = src;
      this.pool.push(ctx);
    }
  }

  /**
   * 播放音效（轮询方式，避免截断）
   */
  play() {
    const ctx = this.pool[this. currentIndex];
    ctx.stop(); // 停止当前实例（如果正在播放）
    ctx. play(); // 重新播放

    // 移动到下一个实例
    this.currentIndex = (this. currentIndex + 1) % this.pool.length;
  }

  /**
   * 销毁所有音频实例
   */
  destroy() {
    this.pool. forEach(ctx => ctx.destroy());
    this.pool = [];
  }
}

export default AudioPool;
```

### 6.3 页面逻辑 (index.js)

```javascript
// pages/index/index.js
import AudioPool from '../../utils/audioManager';

Page({
  data: {
    score: 0,              // 当前得分
    bagImage: '/images/bag_normal.png', // 当前受气包图片
    animClass: 'bag-idle', // 动画类名
    damageTexts: [],       // 飘字数组
  },

  audioPool: null,         // 音效池实例
  recoverTimer: null,      // 恢复状态计时器

  onLoad() {
    // 初始化音效池
    this.audioPool = new AudioPool('/audio/hit1.mp3', 5);
  },

  /**
   * 点击受气包事件
   */
  onHit(e) {
    // 1. 增加分数
    this.setData({
      score: this.data.score + 1
    });

    // 2.  切换为受击图片
    this.setData({
      bagImage: '/images/bag_hit.png',
      animClass: 'is-hit'
    });

    // 3. 播放音效
    this.audioPool. play();

    // 4.  震动反馈
    wx.vibrateShort({
      type: 'heavy'
    });

    // 5.  生成飘字
    this.createDamageText(e.detail.x, e. detail.y);

    // 6. 设置恢复计时器（防抖）
    clearTimeout(this.recoverTimer);
    this.recoverTimer = setTimeout(() => {
      this. setData({
        bagImage: '/images/bag_normal.png',
        animClass: 'bag-idle'
      });
    }, 500);
  },

  /**
   * 生成伤害飘字
   */
  createDamageText(x, y) {
    const id = Date.now();
    const newText = {
      id: id,
      x: x,
      y: y,
      text: '-1'
    };

    this.setData({
      damageTexts: [... this.data.damageTexts, newText]
    });

    // 1秒后移除飘字（动画结束）
    setTimeout(() => {
      this.setData({
        damageTexts: this.data.damageTexts.filter(item => item.id !== id)
      });
    }, 1000);
  },

  onUnload() {
    // 页面卸载时销毁音频池
    if (this.audioPool) {
      this.audioPool.destroy();
    }
  }
});
```

### 6.4 页面结构 (index.wxml)

```xml
<!-- pages/index/index.wxml -->
<view class="container">
  <!-- 顶部栏 -->
  <view class="top-bar">
    <text class="score">💥 得分: {{score}}</text>
    <view class="settings">⚙️</view>
  </view>

  <!-- 血条 -->
  <progress class="health-bar" percent="80" stroke-width="12" activeColor="#FF6B35"/>

  <!-- 受气包主体 -->
  <view class="bag-container" bindtap="onHit">
    <image
      class="bag-img {{animClass}}"
      src="{{bagImage}}"
      mode="aspectFit"
    />

    <!-- 飘字层 -->
    <block wx:for="{{damageTexts}}" wx:key="id">
      <view
        class="damage-text"
        style="left: {{item.x}}px; top: {{item.y}}px;"
      >
        {{item.text}}
      </view>
    </block>
  </view>

  <!-- 底部操作栏 -->
  <view class="bottom-bar">
    <view class="btn">🥊<br/>武器库</view>
    <view class="btn">📸<br/>换脸</view>
    <view class="btn">🏆<br/>排行榜</view>
  </view>
</view>
```

---

## 7. 开发实施规划 (Roadmap)

### 第一阶段：MVP 核心体验 (预计 2 天)

**目标**：实现最基本的"点击-反馈"循环。

*   **Day 1 上午**:
    *   初始化微信小程序原生项目。
    *   完成 `index.wxml` 基础布局（顶部分数、中间图片、底部按钮）。
    *   找 2 张临时图片（正常/受击），放入 `/images` 目录。
*   **Day 1 下午**:
    *   编写 `index.wxss` 中的 `shake` 动画。
    *   实现点击图片 -> CSS 抖动效果（通过 `setData` 切换 class）。
*   **Day 2 上午**:
    *   封装 `AudioPool` 工具类。
    *   集成点击音效（找 3 个免费音效 . mp3）。
    *   集成 `wx.vibrateShort` 震动反馈。
*   **Day 2 下午**:
    *   实现左上角简单的计分逻辑（每次点击 +1）。
    *   **里程碑**：完成可玩的 MVP，可以发给朋友测试手感。

### 第二阶段：功能完善 (预计 2 天)

**目标**：增加趣味性和耐玩度。

*   **Day 3 上午**:
    *   实现"伤害飘字"效果（点击生成临时 View，动画向上飘并淡出）。
*   **Day 3 下午**:
    *   完善底部 UI 布局（三个图标按钮）。
    *   实现"武器切换"基础逻辑（修改全局变量，切换不同音效文件）。
*   **Day 4 上午**:
    *   增加"换脸"功能（利用 `wx.chooseImage` 选择图片，使用 `<image>` 的绝对定位覆盖在受气包上）。
*   **Day 4 下午**:
    *   添加"彩蛋"逻辑（5秒无操作播放嘲讽语音）。
    *   优化动画细节（如受击时的图片切换更流畅）。

### 第三阶段：云端对接 (预计 1 天)

**目标**：实现数据持久化和排行榜。

*   **Day 5 上午**:
    *   开通微信云开发环境。
    *   创建云数据库集合 `users`（字段：`_openid`, `score`, `updateTime`）。
    *   编写云函数 `updateScore`（接收分数并更新数据库）。
*   **Day 5 下午**:
    *   实现排行榜页面（读取云数据库，按 `score` 降序排列）。
    *   **里程碑**：完整功能上线，提交审核。

---

## 8. 资源需求清单 (Resources)

### 8.1 图片资源
*   **受气包图片** (建议尺寸: 512x512px, PNG 透明底)
    *   `bag_normal.png` - 正常/挑衅表情
    *   `bag_hit.png` - 受击/痛苦表情
    *   `bag_cry.png` - 残血/哭泣表情
*   **武器图标** (建议尺寸: 128x128px)
    *   `weapon_fist.png` - 拳头
    *   `weapon_slipper.png` - 拖鞋
    *   `weapon_pan.png` - 平底锅

### 8.2 音频资源
*   **打击音效** (. mp3, 时长 < 1秒)
    *   `hit1.mp3` - 轻击声（如"啪"）
    *   `hit2.mp3` - 重击声（如"砰"）
    *   `hit3. mp3` - 暴击声（如"咚！"）
*   **语音** (.mp3)
    *   `taunt. mp3` - 嘲讽语音（如"就这点力气？"）
    *   `scream.mp3` - 惨叫声（如"哎哟！"）

### 8.3 账号与工具
*   **微信小程序账号**（个人主体即可，免费）
*   **微信开发者工具**（官方 IDE）
*   **图片编辑工具**（推荐：Figma、Photoshop、或在线工具 remove.bg）
*   **音效素材站**：
    *   国内：爱给网 (aigei.com)
    *   国外：Freesound. org

---

## 9. UI设计图生成指南 (Design Generation Guide)

由于无法直接生成图片文件，这里提供两种方案帮助您获得设计稿：

### 9.1 方案一：AI 绘画提示词（推荐）

您可以使用以下提示词在 **AI 绘画工具**（如 Midjourney、Stable Diffusion、文心一格、通义万相）中生成设计参考图。

#### 风格 A：丑萌手绘风（推荐，成本低，易实现）

**提示词（复制到 AI 绘画工具）：**
```
Mobile app UI design, WeChat mini-program interface, a stress-relief game, main screen.  Center is a funny ugly-cute cartoon sandbag character with a goofy face, round body, bright yellow skin, hand-drawn doodle style.  The character has a bruised eye and a bandage.  Background is a simple sketch of a boxing ring, energetic orange and yellow color palette.  Minimalist UI buttons at the bottom: a fist icon, a leaderboard icon.  High saturation, flat illustration, vector style, clean layout, user-friendly, playful vibe.  --ar 9:16
```

**风格特点**：类似暴走漫画或涂鸦风格，看起来就很想打它，制作成本低。

#### 风格 B：3D 黏土风（最近流行，质感好）

**提示词（复制到 AI 绘画工具）：**
```
Mobile app UI design, 3D render, C4D style, plasticine texture, claymorphism.  A cute squishy stress ball character in the center, soft lighting, pastel colors.  The character looks slightly annoyed but cute.  Background is soft blue gradient. Floating UI elements: a health bar at the top, round bubbly buttons at the bottom. High quality, smooth render, isometric view, soft shadows, joyful atmosphere. --ar 9:16
```

**风格特点**：软糯的3D质感，看起来很想捏，视觉上很解压。

### 9.2 方案二：使用设计模板（适合快速开发）

如果您不想等 AI 生成，可以直接使用现成的素材：

1.   **Figma 社区**：搜索 "Game UI Kit" 或 "Mobile Game Interface"，有很多免费模板可以直接复制使用。
2.  **图标库**：
    *   阿里巴巴矢量图标库 (iconfont. cn) - 搜索"拳头"、"表情"、"排行榜"
    *   Flaticon. com - 搜索 "punch", "emotion", "trophy"
3.  **受气包图片**：
    *   去 **Freepik** 或 **花瓣网** 搜索 "卡通怪物" 或 "沙袋插画"
    *   用 **remove.bg** 去除背景

### 9.3 受气包角色设计参考描述

如果您找设计师帮忙，可以把以下描述发给他们：

**角色名称：** 受气包（暂定名：小包包）

**基本形态：**
*   身体：椭圆形或梨形，像个沙袋
*   颜色：亮黄色或肉粉色
*   轮廓：粗黑线条（2-3px），手绘感

**三种表情状态：**

1.  **待机状态 (Normal)**
    *   眼睛：斜着眼，白眼向上
    *   嘴巴：坏笑，露出两颗牙齿
    *   气氛：一副"来打我呀"的挑衅表情

2.   **受击状态 (Hit)**
    *   眼睛：变成 "XX" 或 "@@"（螺旋）
    *   嘴巴：张大成 "O" 形
    *   身体：一边扁一边鼓（被打歪了）
    *   特效：周围有爆炸线、汗珠、星星飞溅

3.  **残血状态 (Damaged)**
    *   眼睛：一只肿成紫色，一只流泪
    *   嘴巴：哭泣或咬牙（可选）
    *   装饰：脸上贴创可贴，流鼻涕

**参考风格：**
*   暴走漫画的"王尼玛"
*   Line 贴图中的"馒头人"
*   《Fall Guys》里的豆子人

---

## 附录：页面完整代码示例

### index.wxml
```xml
<view class="container">
  <view class="top-bar">
    <text class="score">💥 得分: {{score}}</text>
    <view class="settings">⚙️</view>
  </view>

  <progress class="health-bar" percent="80" stroke-width="12" activeColor="#FF6B35"/>

  <view class="bag-container" bindtap="onHit">
    <image class="bag-img {{animClass}}" src="{{bagImage}}" mode="aspectFit"/>
    <block wx:for="{{damageTexts}}" wx:key="id">
      <view class="damage-text" style="left: {{item.x}}px; top: {{item.y}}px;">
        {{item.text}}
      </view>
    </block>
  </view>

  <view class="bottom-bar">
    <view class="btn">🥊<br/>武器库</view>
    <view class="btn">📸<br/>换脸</view>
    <view class="btn">🏆<br/>排行榜</view>
  </view>
</view>
```

### index.wxss
```css
.container {
  height: 100vh;
  background: linear-gradient(180deg, #FFD23F 0%, #FF6B35 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.top-bar {
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 20rpx 40rpx;
  box-sizing: border-box;
}

.score {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.health-bar {
  width: 80%;
  margin: 20rpx 0;
}

.bag-container {
  width: 500rpx;
  height: 500rpx;
  position: relative;
  margin: 100rpx 0;
}

.bag-img {
  width: 100%;
  height: 100%;
}

.bag-idle {
  animation: float 2s ease-in-out infinite;
}

. is-hit {
  animation: shake 0.1s ease-in-out;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
}

@keyframes shake {
  0% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(0.9) rotate(5deg); }
  50% { transform: scale(0.95) rotate(-5deg); }
  75% { transform: scale(0.9) rotate(3deg); }
  100% { transform: scale(1) rotate(0deg); }
}

. damage-text {
  position: absolute;
  font-size: 48rpx;
  font-weight: bold;
  color: #FF0000;
  animation: float-up 1s ease-out forwards;
  pointer-events: none;
}

@keyframes float-up {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(-100rpx);
    opacity: 0;
  }
}

.bottom-bar {
  position: fixed;
  bottom: 30rpx;
  display: flex;
  gap: 60rpx;
}

.btn {
  width: 120rpx;
  height: 120rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}
```

---

**文档结束**

本文档包含了"受气包"微信小程序从概念到实现的完整方案。您可以按照开发路线图逐步实施，有任何技术问题欢迎随时沟通！
