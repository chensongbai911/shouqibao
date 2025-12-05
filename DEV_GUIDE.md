# 开发指南

本文档提供详细的开发步骤和最佳实践。

## 📋 开发前准备

### 1. 环境要求

- **Node.js**: >= 16.x
- **包管理器**: npm 或 pnpm
- **IDE**: HBuilderX 或 VS Code
- **微信开发者工具**: 最新稳定版

### 2. 安装 HBuilderX（推荐）

如果使用 HBuilderX 开发：
1. 下载 [HBuilderX](https://www.dcloud.io/hbuilderx.html)
2. 安装 "uni-app 编译器"
3. 直接打开项目文件夹即可

### 3. 使用 CLI 开发

```bash
# 安装依赖
npm install

# 微信小程序开发
npm run dev:mp-weixin

# H5 开发（浏览器预览）
npm run dev:h5
```

---

## 🚀 快速开始（5分钟上手）

### Step 1: 安装依赖

```bash
cd d:\shouqibao
npm install
```

### Step 2: 准备音频文件

在 `static/audio/` 目录下放置：
- `punch.mp3` - 拳头音效
- `slap.mp3` - 拖鞋音效
- `pan.mp3` - 平底锅音效

**临时方案**：如果暂时没有音效，可以先注释掉 `AudioManager` 相关代码。

### Step 3: 配置微信小程序

1. 打开 `manifest.json`
2. 找到 `mp-weixin.appid` 字段
3. 填入你的微信小程序 AppID（在[微信公众平台](https://mp.weixin.qq.com/)申请）

### Step 4: 运行项目

```bash
npm run dev:mp-weixin
```

### Step 5: 导入微信开发者工具

1. 打开微信开发者工具
2. 选择"导入项目"
3. 项目目录选择：`d:\shouqibao\unpackage\dist\dev\mp-weixin`
4. AppID：填入你的小程序 AppID

---

## 📐 核心模块说明

### 1. 状态管理 (`store/game.js`)

管理全局游戏状态：

```javascript
// 获取 store 实例
import { useGameStore } from '@/store/game';
const gameStore = useGameStore();

// 读取状态
console.log(gameStore.currentScore);  // 当前分数
console.log(gameStore.comboCount);    // 连击数
console.log(gameStore.currentWeapon); // 当前武器

// 调用方法
gameStore.hit();              // 触发一次打击
gameStore.switchWeapon('pan'); // 切换武器
gameStore.reset();            // 重置游戏
```

**关键字段**：
- `currentScore`: 累计分数
- `totalClicks`: 总点击次数
- `comboCount`: 当前连击数
- `currentWeapon`: 当前装备的武器 ID
- `isMuted`: 是否静音
- `isVibrationEnabled`: 是否启用震动

### 2. 受气包组件 (`components/BagSprite.vue`)

核心打击组件，处理表情变化和动画。

**Props**: 无

**Events**:
- `@hit` - 受气包被点击时触发

**表情逻辑**：
- Combo 0-20: 挑衅表情 `>_<`
- Combo 21-50: 受伤表情 `T_T`
- Combo 50+: 眩晕表情 `X_X`

**使用示例**：
```vue
<BagSprite @hit="onBagHit" />
```

### 3. 伤害飘字 (`components/HitText.vue`)

显示伤害数字的飘字特效。

**Props**:
- `damage` (Number): 伤害值
- `isCritical` (Boolean): 是否暴击
- `x` (Number): X 坐标
- `y` (Number): Y 坐标

**使用示例**：
```vue
<HitText
  :damage="100"
  :isCritical="true"
  :x="200"
  :y="300"
/>
```

### 4. 音效管理器 (`utils/AudioManager.js`)

解决高频点击时音效截断问题。

**使用示例**：
```javascript
import AudioManager from '@/utils/AudioManager';

const audioManager = new AudioManager();

// 初始化音频池
audioManager.initPool('/static/audio/punch.mp3');

// 播放音效
audioManager.play();

// 切换静音
audioManager.toggleMute(true);

// 销毁（页面卸载时）
audioManager.destroy();
```

---

## 🎨 UI 样式修改

### 修改主题色

编辑 `uni.scss`：

```scss
$primary-color: #FF6B6B;   // 主色调（红色）
$secondary-color: #FFE66D; // 副色调（黄色）
$accent-color: #FFA502;    // 强调色（橙色）
```

### 修改受气包大小

编辑 `components/BagSprite.vue`：

```scss
.bag-container {
  width: 400rpx;  // 原来是 300rpx
  height: 400rpx;
}
```

### 修改背景渐变

编辑 `pages/index/index.vue`：

```scss
.game-page {
  background: linear-gradient(180deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}
```

---

## 🔧 功能扩展指南

### 添加新武器

#### 1. 在 Store 中添加武器数据

编辑 `store/game.js`：

```javascript
weapons: [
  // ...existing code...
  {
    id: 'hammer',        // 武器 ID
    name: '锤子',        // 显示名称
    icon: '🔨',          // Emoji 图标
    damageMultiplier: 1.5,  // 伤害倍率
    audioSrc: '/static/audio/hammer.mp3'  // 音效路径
  }
]
```

#### 2. 准备音效文件

在 `static/audio/` 下放置 `hammer.mp3`

#### 3. 无需修改 UI

武器选择面板会自动读取 `gameStore.weapons` 数组并展示。

### 添加新成就

按照 `openspec/changes/2025-12-05-game-enhancement-features.md` 中的方案：

#### 1. 创建成就数据文件

新建 `store/achievements.js`：

```javascript
export const achievementList = [
  {
    id: 'first_blood',
    name: '初出茅庐',
    desc: '完成第1次点击',
    icon: '/static/achievements/first.png',
    condition: {
      stat: 'totalClicks',
      operator: '>=',
      value: 1
    },
    reward: {
      type: 'coin',
      value: 100
    }
  }
];
```

#### 2. 创建成就检测器

新建 `utils/achievementChecker.js`：

```javascript
import { achievementList } from '@/store/achievements';

export function checkAchievements(userStats) {
  const newUnlocks = [];

  achievementList.forEach(achievement => {
    if (achievement.unlocked) return;

    const { stat, operator, value } = achievement.condition;
    const currentValue = userStats[stat];

    if (operator === '>=' && currentValue >= value) {
      achievement.unlocked = true;
      newUnlocks.push(achievement);
    }
  });

  return newUnlocks;
}
```

#### 3. 在主页面调用

编辑 `pages/index/index.vue`：

```javascript
import { checkAchievements } from '@/utils/achievementChecker';

const onBagHit = () => {
  // ...existing code...

  // 检查成就
  const newAchievements = checkAchievements({
    totalClicks: gameStore.totalClicks,
    comboCount: gameStore.comboCount
  });

  // 显示成就解锁提示
  newAchievements.forEach(ach => {
    uni.showToast({
      title: `解锁成就：${ach.name}`,
      icon: 'success'
    });
  });
};
```

---

## 🌩️ 微信云开发接入

### 1. 开通云开发环境

1. 登录[微信公众平台](https://mp.weixin.qq.com/)
2. 进入小程序后台 → 开发 → 云开发
3. 开通并创建环境（建议命名：`shouqibao-prod`）

### 2. 初始化云开发

编辑 `App.vue`：

```javascript
onLaunch() {
  // 初始化云开发
  wx.cloud.init({
    env: 'shouqibao-prod-xxxxx', // 替换为你的环境 ID
    traceUser: true
  });
}
```

### 3. 创建排行榜云函数

在 `cloudfunctions/` 目录下创建：

**cloudfunctions/getRanking/index.js**:
```javascript
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const result = await db.collection('rankings')
      .orderBy('score', 'desc')
      .limit(100)
      .get();

    return {
      code: 0,
      data: result.data
    };
  } catch (err) {
    return {
      code: -1,
      message: err.message
    };
  }
};
```

### 4. 上传并部署云函数

1. 在微信开发者工具中右键 `cloudfunctions/getRanking`
2. 选择"上传并部署：云端安装依赖"

### 5. 调用云函数

编辑 `pages/index/index.vue`：

```javascript
const showRanking = async () => {
  uni.showLoading({ title: '加载中...' });

  const res = await wx.cloud.callFunction({
    name: 'getRanking'
  });

  uni.hideLoading();

  if (res.result.code === 0) {
    console.log('排行榜数据:', res.result.data);
    // TODO: 显示排行榜页面
  }
};
```

---

## 🐛 常见问题排查

### 1. 音效不播放

**问题**: 点击受气包没有声音

**解决方案**:
- 检查音频文件是否存在于 `static/audio/` 目录
- 检查音频路径是否正确（以 `/static/` 开头）
- iOS 需用户主动触发才能播放，确保在点击事件中调用
- 检查是否开启了静音模式

### 2. 震动不生效

**问题**: 点击时手机不震动

**解决方案**:
- 检查手机是否开启震动权限
- 部分安卓机型不支持 `vibrateShort`，可改用 `vibrateLong`
- 检查 `gameStore.isVibrationEnabled` 是否为 `true`

### 3. 动画卡顿

**问题**: 连续点击时动画不流畅

**解决方案**:
- 使用 CSS 动画而非 JS 动画
- 避免在动画中操作 DOM
- 使用 `transform` 和 `opacity` 属性（GPU 加速）
- 减少同时播放的动画数量

### 4. 伤害飘字堆叠

**问题**: 飘字特效越来越多，内存泄漏

**解决方案**:
已在代码中实现自动清理机制，确保：
```javascript
setTimeout(() => {
  const index = damageTexts.value.findIndex(t => t.id === id);
  if (index > -1) {
    damageTexts.value.splice(index, 1);
  }
}, 1200);
```

### 5. 真机调试连不上

**解决方案**:
- 确保手机和电脑在同一局域网
- 微信开发者工具 → 详情 → 本地设置 → 不校验合法域名
- 重启微信开发者工具

---

## 📱 真机测试清单

### iOS 测试要点
- [ ] 音效播放是否正常（需用户首次交互后才能播放）
- [ ] 震动反馈是否生效
- [ ] 刘海屏适配（safe-area）
- [ ] 图片加载速度

### Android 测试要点
- [ ] 各品牌机型震动强度差异
- [ ] 低端机性能（连续点击是否卡顿）
- [ ] 音效播放兼容性
- [ ] 返回键行为

### 性能测试
- [ ] 连续点击 100 次，FPS 保持 > 50
- [ ] 内存占用 < 100MB
- [ ] 启动时间 < 2 秒

---

## 🚢 发布流程

### 1. 代码审查

- [ ] 移除所有 `console.log` 调试代码
- [ ] 检查是否有敏感信息（AppID、密钥）
- [ ] 压缩图片和音频资源
- [ ] 确保云函数已部署

### 2. 构建生产版本

```bash
npm run build:mp-weixin
```

### 3. 提交审核

1. 微信开发者工具 → 上传
2. 填写版本号和备注
3. 登录微信公众平台 → 版本管理 → 提交审核
4. 填写功能描述和测试账号

### 4. 审核注意事项

- 提供清晰的功能说明截图
- 确保内容健康（避免暴力、血腥元素）
- 不要使用真人照片作为默认受气包
- 遵守微信小程序运营规范

---

## 💡 性能优化建议

### 1. 图片优化
- 使用 TinyPNG 压缩图片
- 使用 WebP 格式（小程序支持）
- 懒加载非首屏图片

### 2. 代码优化
- 使用 `computed` 而非 `watch`
- 避免频繁操作 `setData`
- 使用函数防抖和节流

### 3. 音频优化
- 音效文件 < 100KB
- 使用 MP3 格式（兼容性好）
- 预加载常用音效

---

## 📚 参考资源

- [UniApp 官方文档](https://uniapp.dcloud.net.cn/)
- [微信小程序 API 文档](https://developers.weixin.qq.com/miniprogram/dev/api/)
- [Pinia 状态管理](https://pinia.vuejs.org/)
- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

开发分支规范：
- `main` - 生产环境
- `dev` - 开发环境
- `feature/*` - 新功能分支
- `fix/*` - Bug 修复分支
