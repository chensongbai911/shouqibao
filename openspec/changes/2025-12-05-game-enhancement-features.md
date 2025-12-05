# 变更提案：游戏增强功能套件

**提案编号：** CHANGE-2025-12-05-001
**提案日期：** 2025年12月5日
**提案状态：** 🟡 待审核 (Pending Review)
**影响范围：** 中等 - 新增多个功能模块
**预计工作量：** 10-15 个工作日

---

## 📋 概述 (Overview)

本提案旨在为"受气包解压小程序"添加六大核心功能模块，以提升用户留存率、娱乐性和变现能力：

1. **新武器类型系统** - 扩展武器库，增加稀有度和解锁机制
2. **成就系统** - 提供长期目标和即时反馈
3. **好友对战** - 增加社交竞技元素
4. **每日任务** - 提升日活和用户粘性
5. **音效自定义** - 允许用户上传/选择个性化音效
6. **皮肤商城** - 引入虚拟商品经济系统

---

## 🎯 动机 (Motivation)

### 当前痛点
- **留存不足**：用户打击几次后缺乏新鲜感
- **单调体验**：武器和视觉反馈有限
- **社交缺失**：没有与好友互动的机制
- **变现困难**：缺乏可持续的收入模式

### 预期收益
- ✅ **提升 7 日留存率** 从 20% → 40%
- ✅ **增加日均使用时长** 从 2 分钟 → 5 分钟
- ✅ **提高分享率** 通过好友对战功能
- ✅ **建立变现渠道** 通过皮肤商城

---

## 📦 功能 1: 新武器类型系统

### 设计目标
扩展现有的 3 种武器（拳头/拖鞋/平底锅）至 **15+ 种武器**，引入稀有度和解锁机制。

### 新增武器分类

| 稀有度 | 武器名称 | 伤害倍率 | 特效 | 解锁条件 |
|--------|----------|----------|------|----------|
| ⚪ 普通 | 拳头 | 1x | 普通音效 | 初始拥有 |
| ⚪ 普通 | 拖鞋 | 1x | 啪嗒声 | 初始拥有 |
| ⚪ 普通 | 平底锅 | 1.2x | 铛铛声 | 初始拥有 |
| 🟢 稀有 | 榴莲 | 1.5x | 臭气特效 | 累计 1000 次点击 |
| 🟢 稀有 | 键盘 | 1.5x | 程序员梗 | 分享 3 次 |
| 🔵 史诗 | 雷神之锤 | 2x | 闪电特效 | 达成"连击王"成就 |
| 🔵 史诗 | 龙虾 | 2x | 钳子动画 | 商城购买 (9.9元) |
| 🟣 传说 | 无限手套 | 3x | 灰飞烟灭 | 排行榜前 10 |
| 🟡 神话 | 橡皮擦 | 5x | 擦除效果 | 限时活动获得 |

### 技术实现

#### 数据结构
```javascript
// store/weapons.js
export const weaponList = [
  {
    id: 'fist',
    name: '拳头',
    rarity: 'common',
    damageMultiplier: 1,
    icon: '/static/weapons/fist.png',
    audioSrc: '/static/audio/punch.mp3',
    unlocked: true,
    effectType: 'normal'
  },
  {
    id: 'durian',
    name: '榴莲',
    rarity: 'rare',
    damageMultiplier: 1.5,
    icon: '/static/weapons/durian.png',
    audioSrc: '/static/audio/durian.mp3',
    unlocked: false,
    unlockCondition: { type: 'clicks', value: 1000 },
    effectType: 'stink' // 臭气粒子特效
  }
  // ...更多武器
];
```

#### 组件变更
**文件：** `components/WeaponPanel.vue`
```vue
<template>
  <view class="weapon-panel">
    <!-- 新增：稀有度筛选 -->
    <view class="rarity-filter">
      <button
        v-for="rarity in rarities"
        :key="rarity"
        @click="filterByRarity(rarity)"
      >
        {{ rarity }}
      </button>
    </view>

    <!-- 武器网格 -->
    <view class="weapon-grid">
      <view
        v-for="weapon in filteredWeapons"
        :key="weapon.id"
        :class="['weapon-item', weapon.rarity, { locked: !weapon.unlocked }]"
        @click="selectWeapon(weapon)"
      >
        <image :src="weapon.icon" />
        <text>{{ weapon.name }}</text>

        <!-- 未解锁提示 -->
        <view v-if="!weapon.unlocked" class="lock-overlay">
          🔒 {{ weapon.unlockCondition.desc }}
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useWeaponStore } from '@/store/weapons';

const weaponStore = useWeaponStore();
const selectedRarity = ref('all');

const filteredWeapons = computed(() => {
  if (selectedRarity.value === 'all') return weaponStore.weapons;
  return weaponStore.weapons.filter(w => w.rarity === selectedRarity.value);
});
</script>
```

#### 云数据库结构
```javascript
// 集合：user_weapons
{
  _id: "xxx",
  _openid: "user123",
  unlockedWeapons: ['fist', 'slipper', 'pan', 'durian'],
  equippedWeapon: 'durian',
  updateTime: Date
}
```

---

## 🏆 功能 2: 成就系统

### 设计目标
提供 **30+ 成就**，覆盖不同玩法维度，增强游戏深度。

### 成就分类

#### A. 基础成就（新手引导）
| 成就名称 | 条件 | 奖励 |
|----------|------|------|
| 初出茅庐 | 完成第 1 次点击 | 解锁"新手光环"称号 |
| 百发百中 | 累计点击 100 次 | 获得 100 金币 |
| 千锤百炼 | 累计点击 1000 次 | 解锁"榴莲"武器 |

#### B. 技巧成就（高难度）
| 成就名称 | 条件 | 奖励 |
|----------|------|------|
| 连击王 | 单次连击 50 combo | 解锁"雷神之锤" |
| 光速手 | 1 秒内点击 10 次 | 获得"闪电"特效 |
| 马拉松战士 | 连续打击 10 分钟不停 | 解锁"不屈"皮肤 |

#### C. 社交成就
| 成就名称 | 条件 | 奖励 |
|----------|------|------|
| 社交达人 | 分享给 10 位好友 | 获得稀有皮肤抽奖券 |
| 擂台冠军 | 好友对战获胜 5 次 | 解锁"王者"边框 |

#### D. 收集成就
| 成就名称 | 条件 | 奖励 |
|----------|------|------|
| 武器大师 | 收集全部普通武器 | 获得 500 金币 |
| 皮肤狂热者 | 拥有 10 款皮肤 | 解锁隐藏皮肤 |

### 技术实现

#### 成就数据结构
```javascript
// store/achievements.js
export const achievementList = [
  {
    id: 'first_blood',
    name: '初出茅庐',
    desc: '完成第1次点击',
    icon: '/static/achievements/first.png',
    type: 'basic',
    condition: {
      stat: 'totalClicks',
      operator: '>=',
      value: 1
    },
    reward: {
      type: 'title',
      value: 'newbie_halo'
    },
    unlocked: false,
    unlockedAt: null
  }
  // ...更多成就
];
```

#### 成就检测逻辑
```javascript
// utils/achievementChecker.js
export function checkAchievements(userStats) {
  const newUnlocks = [];

  achievementList.forEach(achievement => {
    if (achievement.unlocked) return;

    const { stat, operator, value } = achievement.condition;
    const currentValue = userStats[stat];

    let unlocked = false;
    switch (operator) {
      case '>=': unlocked = currentValue >= value; break;
      case '==': unlocked = currentValue === value; break;
      // ...更多条件
    }

    if (unlocked) {
      achievement.unlocked = true;
      achievement.unlockedAt = new Date();
      newUnlocks.push(achievement);

      // 发放奖励
      grantReward(achievement.reward);
    }
  });

  return newUnlocks; // 返回新解锁的成就用于弹窗展示
}
```

#### UI 组件
**新增文件：** `pages/achievements/index.vue`
```vue
<template>
  <view class="achievement-page">
    <view class="progress-bar">
      已解锁: {{ unlockedCount }} / {{ totalCount }}
    </view>

    <view class="achievement-list">
      <view
        v-for="ach in achievements"
        :key="ach.id"
        :class="['ach-card', { unlocked: ach.unlocked }]"
      >
        <image :src="ach.icon" :class="{ grayscale: !ach.unlocked }" />
        <view class="info">
          <text class="name">{{ ach.name }}</text>
          <text class="desc">{{ ach.desc }}</text>
        </view>
        <view v-if="ach.unlocked" class="badge">✓</view>
      </view>
    </view>
  </view>
</template>
```

---

## ⚔️ 功能 3: 好友对战

### 设计目标
引入 **异步 PVP 机制**，允许玩家挑战好友的最高分，增强社交传播。

### 对战模式

#### 模式 A：分数挑战赛
- 玩家 A 挑战玩家 B 的"今日最高分"
- 限时 60 秒，看谁打出更高伤害
- 胜者获得奖励（金币/称号）

#### 模式 B：连击竞速
- 比拼谁先达到 100 combo
- 记录最快时间

### 交互流程
```
1. 玩家点击"好友对战"按钮
2. 选择好友（从微信好友列表或小程序内好友）
3. 发送挑战（微信卡片分享）
4. 好友点击卡片进入对战模式
5. 对战结束后生成战报分享
```

### 技术实现

#### 对战数据结构
```javascript
// 云数据库集合：battle_records
{
  _id: "battle_xxx",
  challenger: {
    openid: "user_a",
    nickname: "张三",
    avatar: "https://xxx.jpg",
    score: 9999
  },
  defender: {
    openid: "user_b",
    nickname: "李四",
    avatar: "https://yyy.jpg",
    score: 8888
  },
  battleMode: "score_challenge",
  winner: "user_a",
  battleTime: Date,
  status: "completed" // pending | completed
}
```

#### 挑战发起逻辑
```javascript
// pages/battle/challenge.js
async function sendChallenge(friendOpenId) {
  // 1. 创建对战记录
  const battleRecord = await wx.cloud.callFunction({
    name: 'createBattle',
    data: {
      defenderOpenId: friendOpenId,
      mode: 'score_challenge'
    }
  });

  // 2. 分享微信卡片
  wx.shareAppMessage({
    title: `我向你发起了受气包对战挑战！`,
    path: `/pages/battle/arena?battleId=${battleRecord.battleId}`,
    imageUrl: '/static/share/battle.png'
  });
}
```

#### 对战页面
**新增文件：** `pages/battle/arena.vue`
```vue
<template>
  <view class="battle-arena">
    <!-- 倒计时 -->
    <view class="timer">{{ countdown }}s</view>

    <!-- 对战双方信息 -->
    <view class="vs-panel">
      <view class="player">
        <image :src="challenger.avatar" />
        <text>{{ challenger.nickname }}</text>
        <text class="score">{{ challenger.score }}</text>
      </view>

      <text class="vs">VS</text>

      <view class="player">
        <image :src="defender.avatar" />
        <text>{{ defender.nickname }}</text>
        <text class="score">{{ defender.score }}</text>
      </view>
    </view>

    <!-- 受气包（复用现有组件） -->
    <BagSprite @hit="onBattleHit" />

    <!-- 战报 -->
    <view v-if="battleEnded" class="result-panel">
      <text class="winner">{{ winner.nickname }} 获胜！</text>
      <button @click="shareResult">分享战报</button>
    </view>
  </view>
</template>
```

---

## 📅 功能 4: 每日任务

### 设计目标
提供 **每日 3 个任务**，引导用户每天打开小程序，提升日活。

### 任务类型

#### 每日任务池（每天随机 3 个）
| 任务名称 | 目标 | 奖励 |
|----------|------|------|
| 早起解压 | 09:00 前完成 10 次点击 | 50 金币 |
| 午间放松 | 点击受气包 50 次 | 100 金币 |
| 武器试炼 | 使用 3 种不同武器各打 10 次 | 稀有武器抽奖券 |
| 连击大师 | 达成 30 combo | 特效皮肤碎片 x1 |
| 社交任务 | 分享 1 次 | 200 金币 |

#### 周常任务
| 任务名称 | 目标 | 奖励 |
|----------|------|------|
| 本周之星 | 累计点击 500 次 | 史诗武器宝箱 |
| 对战王者 | 好友对战获胜 3 次 | 传说皮肤碎片 x3 |

### 技术实现

#### 任务数据结构
```javascript
// 云数据库集合：user_daily_tasks
{
  _openid: "user123",
  date: "2025-12-05",
  tasks: [
    {
      id: "task_morning_clicks",
      name: "早起解压",
      desc: "09:00前完成10次点击",
      progress: 7,
      target: 10,
      reward: { type: 'coin', value: 50 },
      completed: false,
      claimed: false
    }
    // ...另外2个任务
  ],
  refreshTime: Date
}
```

#### 任务刷新逻辑
```javascript
// cloudfunctions/refreshDailyTasks/index.js
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const today = new Date().toISOString().split('T')[0];

  // 检查今天是否已刷新
  const existingTasks = await db.collection('user_daily_tasks')
    .where({ _openid: OPENID, date: today })
    .get();

  if (existingTasks.data.length > 0) {
    return { code: 0, data: existingTasks.data[0] };
  }

  // 从任务池随机抽取3个
  const allTasks = [...dailyTaskPool];
  const selectedTasks = shuffleArray(allTasks).slice(0, 3);

  // 初始化任务进度
  const tasksData = selectedTasks.map(task => ({
    ...task,
    progress: 0,
    completed: false,
    claimed: false
  }));

  // 写入数据库
  await db.collection('user_daily_tasks').add({
    data: {
      date: today,
      tasks: tasksData,
      refreshTime: new Date()
    }
  });

  return { code: 0, data: tasksData };
};
```

#### UI 组件
**新增文件：** `components/DailyTaskPanel.vue`
```vue
<template>
  <view class="task-panel">
    <view class="header">
      <text>每日任务</text>
      <text class="refresh-tip">明日 00:00 刷新</text>
    </view>

    <view v-for="task in tasks" :key="task.id" class="task-item">
      <view class="info">
        <text class="name">{{ task.name }}</text>
        <text class="desc">{{ task.desc }}</text>
      </view>

      <!-- 进度条 -->
      <view class="progress">
        <view
          class="bar"
          :style="{ width: (task.progress / task.target * 100) + '%' }"
        />
        <text>{{ task.progress }} / {{ task.target }}</text>
      </view>

      <!-- 奖励按钮 -->
      <button
        v-if="task.completed && !task.claimed"
        @click="claimReward(task)"
        class="claim-btn"
      >
        领取 {{ task.reward.value }} 💰
      </button>
      <view v-else-if="task.claimed" class="claimed">✓ 已领取</view>
    </view>
  </view>
</template>
```

---

## 🎵 功能 5: 音效自定义

### 设计目标
允许用户上传或从音效库选择个性化打击音效。

### 功能特性
1. **内置音效库**：提供 20+ 预设音效（动物叫声、方言骂人、搞笑梗）
2. **用户上传**：支持上传 MP3 文件（≤ 500KB）
3. **文字转语音（TTS）**：输入文字自动生成语音

### 音效分类

| 分类 | 音效示例 | 解锁方式 |
|------|----------|----------|
| 基础 | 拳击声、巴掌声 | 免费 |
| 搞笑 | "awsl"、"真香"、"哎哟喂" | 观看广告解锁 |
| 方言 | 东北话"干哈呢"、粤语"扑街" | 金币购买 |
| 动物 | 猪叫、鸭叫、狗叫 | 成就解锁 |
| 明星 | （需授权）经典台词 | 付费购买 |
| 自定义 | 用户上传 | VIP 功能 |

### 技术实现

#### 音效管理器
```javascript
// utils/AudioManager.js
class AudioManager {
  constructor() {
    this.audioPool = []; // 音频实例池
    this.currentSound = 'punch'; // 当前选中音效
    this.soundLibrary = new Map(); // 音效库
  }

  // 加载音效库
  async loadSoundLibrary() {
    const sounds = await wx.cloud.database()
      .collection('sound_library')
      .get();

    sounds.data.forEach(sound => {
      this.soundLibrary.set(sound.id, sound.url);
    });
  }

  // 切换音效
  switchSound(soundId) {
    this.currentSound = soundId;
    // 清空旧的音频池
    this.audioPool.forEach(audio => audio.destroy());
    this.audioPool = [];
    // 重新创建音频池
    this.initAudioPool(this.soundLibrary.get(soundId));
  }

  // 上传自定义音效
  async uploadCustomSound(filePath) {
    // 1. 压缩检查
    const fileInfo = await wx.getFileInfo({ filePath });
    if (fileInfo.size > 500 * 1024) {
      throw new Error('文件超过500KB');
    }

    // 2. 上传到云存储
    const cloudPath = `custom-sounds/${Date.now()}-${Math.random()}.mp3`;
    const result = await wx.cloud.uploadFile({
      cloudPath,
      filePath
    });

    // 3. 保存到数据库
    await wx.cloud.database().collection('user_custom_sounds').add({
      data: {
        cloudPath,
        fileID: result.fileID,
        uploadTime: new Date()
      }
    });

    return result.fileID;
  }
}
```

#### TTS 集成
```javascript
// 调用微信云开发或第三方 TTS API
async function textToSpeech(text) {
  const result = await wx.cloud.callFunction({
    name: 'tts',
    data: {
      text: text,
      voice: 'zh-CN-XiaoxiaoNeural', // 微软 TTS
      speed: 1.2
    }
  });

  return result.audioUrl;
}
```

#### UI 界面
**新增文件：** `pages/sound-custom/index.vue`
```vue
<template>
  <view class="sound-custom">
    <!-- 音效库 -->
    <view class="sound-library">
      <view
        v-for="sound in soundList"
        :key="sound.id"
        :class="['sound-item', { selected: currentSound === sound.id }]"
        @click="selectSound(sound)"
      >
        <text>{{ sound.name }}</text>
        <button @click.stop="previewSound(sound)">试听</button>
      </view>
    </view>

    <!-- 上传区域 -->
    <view class="upload-area">
      <button @click="chooseAudio">上传音效文件</button>
      <text class="tip">支持 MP3 格式，≤ 500KB</text>
    </view>

    <!-- TTS 生成 -->
    <view class="tts-area">
      <input
        v-model="ttsText"
        placeholder="输入文字，生成语音"
        maxlength="20"
      />
      <button @click="generateTTS">生成</button>
    </view>
  </view>
</template>

<script setup>
const chooseAudio = () => {
  wx.chooseMessageFile({
    count: 1,
    type: 'file',
    extension: ['mp3'],
    success: async (res) => {
      const filePath = res.tempFiles[0].path;
      const fileID = await audioManager.uploadCustomSound(filePath);
      uni.showToast({ title: '上传成功！' });
    }
  });
};
</script>
```

---

## 🛍️ 功能 6: 皮肤商城

### 设计目标
建立虚拟商品经济系统，提供多样化的视觉定制选项，并实现变现。

### 商品分类

#### A. 受气包皮肤
| 皮肤名称 | 效果 | 价格 | 类型 |
|----------|------|------|------|
| 经典款 | 默认丑萌脸 | 免费 | 默认 |
| 猪头 | 粉色小猪 | 100 金币 | 普通 |
| 西瓜 | 被打碎开裂 | 500 金币 | 稀有 |
| 地球 | 宇宙级打击 | 1000 金币 | 史诗 |
| 老板脸 | 自定义上传 | 9.9 元 | 付费 |
| 赛博朋克 | 霓虹特效 | 19.9 元 | 付费 |

#### B. 背景主题
| 主题 | 场景 | 价格 |
|------|------|------|
| 办公室 | 工位、电脑 | 免费 |
| 拳击擂台 | 拳台、观众 | 300 金币 |
| 太空 | 星空、流星 | 600 金币 |
| 地狱 | 火焰、熔岩 | 12.9 元 |

#### C. 特效包
| 特效 | 效果 | 价格 |
|------|------|------|
| 火焰拳 | 打击带火焰 | 200 金币 |
| 冰冻 | 结冰裂开 | 400 金币 |
| 闪电 | 雷电链 | 6.9 元 |

### 货币系统

#### 金币获取途径
- ✅ 完成每日任务：50-200 金币/天
- ✅ 达成成就：100-500 金币
- ✅ 观看激励广告：20 金币/次（每日上限 5 次）
- ✅ 好友对战获胜：30 金币/次

#### 付费点设计
- **单品购买**：6.9-19.9 元
- **月卡**：18 元（每日赠送 100 金币 + VIP 特权）
- **礼包**：68 元（10 款皮肤 + 5 款武器 + 3000 金币）

### 技术实现

#### 商城数据结构
```javascript
// 云数据库集合：shop_items
{
  _id: "item_xxx",
  type: "skin", // skin | background | effect | weapon
  name: "猪头皮肤",
  desc: "变身可爱小猪",
  icon: "/static/shop/pig.png",
  previewImage: "/static/shop/pig_preview.gif",
  rarity: "common",
  price: {
    type: "coin", // coin | rmb
    value: 100
  },
  tags: ["搞笑", "动物"],
  salesCount: 1234,
  rating: 4.8,
  onSale: true
}
```

#### 购买流程
```javascript
// 金币购买
async function buySkinWithCoin(itemId) {
  const item = await getItemById(itemId);
  const userCoin = await getUserCoin();

  if (userCoin < item.price.value) {
    uni.showToast({ title: '金币不足', icon: 'none' });
    return;
  }

  // 调用云函数扣除金币并发放物品
  const result = await wx.cloud.callFunction({
    name: 'purchaseItem',
    data: { itemId }
  });

  if (result.code === 0) {
    uni.showToast({ title: '购买成功！' });
    // 刷新背包
    refreshInventory();
  }
}

// 人民币购买
async function buySkinWithRMB(itemId) {
  const item = await getItemById(itemId);

  // 调用微信支付
  wx.requestPayment({
    timeStamp: '',
    nonceStr: '',
    package: '',
    signType: 'MD5',
    paySign: '',
    success: async (res) => {
      // 支付成功后调用云函数发放商品
      await wx.cloud.callFunction({
        name: 'grantPurchasedItem',
        data: { itemId, orderId: res.orderId }
      });
    }
  });
}
```

#### 商城页面
**新增文件：** `pages/shop/index.vue`
```vue
<template>
  <view class="shop-page">
    <!-- 用户金币显示 -->
    <view class="coin-bar">
      <text>💰 {{ userCoins }}</text>
      <button @click="recharge">充值</button>
    </view>

    <!-- 分类标签 -->
    <scroll-view scroll-x class="category-tabs">
      <view
        v-for="cat in categories"
        :key="cat"
        :class="['tab', { active: activeCategory === cat }]"
        @click="activeCategory = cat"
      >
        {{ cat }}
      </view>
    </scroll-view>

    <!-- 商品网格 -->
    <scroll-view scroll-y class="item-grid">
      <view
        v-for="item in filteredItems"
        :key="item._id"
        class="item-card"
        @click="showItemDetail(item)"
      >
        <image :src="item.icon" mode="aspectFill" />
        <view class="info">
          <text class="name">{{ item.name }}</text>
          <view class="price">
            <text v-if="item.price.type === 'coin'">
              💰 {{ item.price.value }}
            </text>
            <text v-else class="rmb">
              ¥{{ item.price.value }}
            </text>
          </view>
        </view>
        <view v-if="item.owned" class="owned-badge">已拥有</view>
      </view>
    </scroll-view>
  </view>
</template>
```

---

## 🗄️ 数据库设计

### 新增数据库集合

```javascript
// 1. user_weapons - 用户武器库
{
  _openid: "user123",
  unlockedWeapons: ["fist", "slipper", "durian"],
  equippedWeapon: "durian"
}

// 2. user_achievements - 用户成就
{
  _openid: "user123",
  achievements: [
    { id: "first_blood", unlockedAt: Date, claimed: true }
  ]
}

// 3. battle_records - 对战记录
{
  challenger: { openid, score },
  defender: { openid, score },
  winner: "openid",
  battleTime: Date
}

// 4. user_daily_tasks - 每日任务
{
  _openid: "user123",
  date: "2025-12-05",
  tasks: [ /* 任务数据 */ ]
}

// 5. user_custom_sounds - 自定义音效
{
  _openid: "user123",
  fileID: "cloud://xxx.mp3",
  uploadTime: Date
}

// 6. shop_items - 商城商品
{
  type: "skin",
  name: "猪头皮肤",
  price: { type: "coin", value: 100 }
}

// 7. user_inventory - 用户背包
{
  _openid: "user123",
  skins: ["pig", "watermelon"],
  equippedSkin: "pig",
  coins: 1500
}
```

---

## 🎨 UI/UX 变更

### 新增页面
1. `/pages/weapons/index` - 武器库页面
2. `/pages/achievements/index` - 成就页面
3. `/pages/battle/arena` - 对战竞技场
4. `/pages/tasks/index` - 任务中心
5. `/pages/sound-custom/index` - 音效定制
6. `/pages/shop/index` - 皮肤商城
7. `/pages/inventory/index` - 我的背包

### 主页面调整
**文件：** `pages/index/index.vue`
```vue
<!-- 新增底部导航栏 -->
<view class="bottom-nav">
  <button @click="goTo('/pages/weapons/index')">🥊 武器</button>
  <button @click="goTo('/pages/tasks/index')">📋 任务</button>
  <button @click="goTo('/pages/battle/arena')">⚔️ 对战</button>
  <button @click="goTo('/pages/shop/index')">🛍️ 商城</button>
  <button @click="goTo('/pages/achievements/index')">🏆 成就</button>
</view>

<!-- 新增悬浮任务提示 -->
<view class="task-float-tip" v-if="hasUnclaimedReward">
  <text>有奖励可领取！</text>
</view>
```

---

## 📊 性能与优化

### 资源加载优化
- **分包加载**：商城、成就等非核心功能使用分包
- **图片懒加载**：商城商品图片使用懒加载
- **音效预加载**：仅预加载当前选中的音效

### 云开发优化
- **数据库索引**：为 `_openid`、`date` 等字段建索引
- **云函数缓存**：排行榜数据缓存 5 分钟
- **CDN 加速**：静态资源使用云存储 CDN

---

## 🚀 实施计划

### 阶段 1（3天）：基础架构
- [ ] 创建新的数据库集合
- [ ] 搭建状态管理（Pinia）
- [ ] 创建基础组件框架

### 阶段 2（4天）：核心功能开发
- [ ] 武器系统 + 解锁逻辑
- [ ] 成就系统 + 检测器
- [ ] 每日任务 + 刷新机制

### 阶段 3（3天）：社交与商城
- [ ] 好友对战 + 分享卡片
- [ ] 皮肤商城 + 支付集成

### 阶段 4（3天）：音效与优化
- [ ] 音效自定义 + TTS
- [ ] 性能优化
- [ ] 真机测试

### 阶段 5（2天）：测试与发布
- [ ] 完整流程测试
- [ ] 修复 bug
- [ ] 提交审核

---

## ⚠️ 风险与挑战

| 风险点 | 影响 | 缓解方案 |
|--------|------|----------|
| 微信支付接入门槛 | 高 | 先实现金币系统，支付后续接入 |
| 云开发免费额度超限 | 中 | 实施数据缓存 + CDN |
| 用户上传音效审核 | 高 | 先做预设音效库，自定义功能后续开放 |
| 好友对战实时性要求 | 中 | 采用异步对战，降低技术复杂度 |

---

## 📈 成功指标

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| 7日留存率 | 20% | 40% |
| 日均使用时长 | 2分钟 | 5分钟 |
| 付费转化率 | 0% | 3% |
| 日活跃用户 | - | 1000+ |
| 分享率 | 5% | 15% |

---

## 💬 待讨论问题

1. **付费定价策略**：单品 6.9-19.9 元是否合理？
2. **武器平衡性**：高稀有度武器的伤害倍率上限？
3. **防沉迷机制**：是否需要限制每日游戏时长？
4. **审核风险**：搞笑音效和表情包是否会触发审核？

---

## 📝 审批流程

- [ ] 产品经理审批
- [ ] 技术负责人评审
- [ ] UI/UX 设计师确认
- [ ] 开始开发

**提案人：** GitHub Copilot
**联系方式：** -
**期望开始时间：** 2025年12月10日
