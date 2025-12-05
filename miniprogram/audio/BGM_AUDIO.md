# 背景音乐（BGM）资源说明

## 需要准备的BGM文件

### BGM 文件
- **文件名：** `bgm.mp3`
- **用途：** 游戏背景音乐，循环播放
- **时长：** 1-3 分钟（会自动循环）
- **格式：** MP3（推荐）或 AAC
- **文件大小：** < 500KB（压缩后）

---

## 音乐风格建议

### 推荐风格
根据游戏"解压"主题，推荐以下音乐风格：

#### 1. 轻松欢快型（推荐⭐⭐⭐⭐⭐）
- **风格：** 俏皮、轻快、8-bit 复古
- **情绪：** 让玩家感觉在玩休闲游戏
- **参考：** 超级马里奥BGM、俄罗斯方块音乐
- **适用场景：** 大众玩家，减压娱乐

#### 2. 节奏感强型
- **风格：** 电子音乐、Dubstep
- **情绪：** 激励玩家快速点击
- **参考：** Beat Saber、音游背景乐
- **适用场景：** 喜欢连击的玩家

#### 3. 搞笑诙谐型
- **风格：** 滑稽音效、马戏团音乐
- **情绪：** 搞笑、不正经
- **参考：** 可爱颂、葫芦娃
- **适用场景：** 娱乐向玩家

#### 4. 安静氛围型
- **风格：** Lo-fi、纯音乐
- **情绪：** 放松、冥想
- **参考：** Lofi Girl 系列
- **适用场景：** 需要安静减压的玩家

---

## 音乐获取渠道

### 免费音乐库（推荐）

#### 1. Incompetech（免费商用）
- **网址：** https://incompetech.com/music/
- **授权：** Creative Commons（需署名）
- **搜索关键词：** "Funny" "Game" "8-bit" "Upbeat"
- **推荐曲目：**
  - "Scheming Weasel" - 俏皮搞笑
  - "Pixel Peeker Polka" - 8-bit风格
  - "Wallpaper" - 轻快循环

#### 2. FreePD（完全免费）
- **网址：** https://freepd.com/
- **授权：** Public Domain（无需署名）
- **分类：** Comedy、Video Game、Electronic

#### 3. Pixabay（免费无版权）
- **网址：** https://pixabay.com/music/
- **授权：** 完全免费，无需署名
- **搜索：** "funny music" "game music" "8-bit"

#### 4. 爱给网（中文资源）
- **网址：** https://www.aigei.com/music/
- **搜索：** "游戏音乐" "轻快" "8位"
- **筛选：** 免费资源

#### 5. YouTube Audio Library
- **网址：** https://www.youtube.com/audiolibrary
- **授权：** 部分免费商用
- **筛选：** Genre: Electronic, Mood: Happy

---

## 音频规格要求

| 属性 | 要求 | 说明 |
|-----|------|------|
| 格式 | MP3 | 兼容性最好 |
| 采样率 | 44100Hz | 标准音质 |
| 比特率 | 128kbps | 平衡音质和大小 |
| 时长 | 1-3分钟 | 自动循环 |
| 文件大小 | < 500KB | 避免包体过大 |
| 音量 | 适中 | 代码中已设置 0.3 音量 |

---

## 音频处理工具

### 在线工具
1. **Media.io**
   - https://www.media.io/audio-compressor.html
   - 在线压缩音频

2. **Online Audio Converter**
   - https://online-audio-converter.com/
   - 格式转换 + 压缩

### 桌面软件
1. **Audacity**（免费开源）
   - 下载：https://www.audacityteam.org/
   - 功能：剪辑、淡入淡出、循环、导出

2. **FL Studio Mobile**（付费）
   - 专业音乐制作软件
   - 可制作8-bit音乐

---

## 音乐处理步骤

### 使用 Audacity 处理BGM

1. **导入音频**
   - File → Open → 选择下载的音乐

2. **剪辑长度**（如果太长）
   - 选中 1-2 分钟的精彩片段
   - Edit → Remove Audio or Labels → Trim Audio

3. **添加淡入淡出**
   - 选中开头 3 秒 → Effect → Fade In
   - 选中结尾 3 秒 → Effect → Fade Out

4. **调整音量**
   - Effect → Amplify → 设置为 -6dB

5. **导出为 MP3**
   - File → Export → Export as MP3
   - 比特率：128kbps
   - 保存为 `bgm.mp3`

---

## 临时方案

### 如果暂时没有BGM文件：

#### 方案 A：禁用BGM功能
修改 `index.js`：
```javascript
initBGM() {
  // 暂时注释掉BGM初始化
  console.log('BGM功能暂未开启');
}
```

#### 方案 B：使用占位音频
创建一个 3 秒的静音文件：
```bash
# 使用 Audacity
Generate → Silence → 3 seconds → 导出为 bgm.mp3
```

#### 方案 C：复用音效
将打击音效复制为BGM（虽然不适合循环）：
```bash
copy hit.mp3 bgm.mp3
```

---

## BGM 控制说明

### 代码实现
```javascript
// 初始化BGM
this.bgmAudioContext = wx.createInnerAudioContext();
this.bgmAudioContext.src = '/audio/bgm.mp3';
this.bgmAudioContext.loop = true;     // 自动循环
this.bgmAudioContext.volume = 0.3;    // 音量 30%

// 播放/暂停
bgmPlaying ? this.bgmAudioContext.play() : this.bgmAudioContext.pause();
```

### 用户控制
- **右侧BGM按钮：** 点击切换播放/暂停
- **图标显示：** 🔊 播放中 | 🔇 已静音
- **状态持久化：** 用户选择会保存到本地存储

---

## 音乐版权说明

### 安全使用建议
1. ✅ **使用 CC0/Public Domain 音乐** - 完全免费无需署名
2. ✅ **使用 CC BY 音乐** - 需要在"关于"页面署名
3. ⚠️ **避免使用有版权音乐** - 可能导致小程序下架
4. ⚠️ **商用需确认授权** - 如果小程序有广告或收费

### 署名示例（CC BY音乐）
可以在小程序的"关于"页面添加：
```
BGM: "Song Title" by Artist Name
Licensed under CC BY 3.0
https://incompetech.com
```

---

## 推荐BGM列表

| 曲名 | 风格 | 时长 | 来源 | 授权 |
|-----|------|------|------|------|
| Pixel Peeker Polka | 8-bit | 2:13 | Incompetech | CC BY |
| Scheming Weasel | 搞笑 | 2:05 | Incompetech | CC BY |
| Fun in a Bottle | 轻快 | 1:45 | FreePD | Public Domain |
| Carefree Melody | Lo-fi | 2:30 | Pixabay | Free |
| 8-bit Adventure | 复古 | 2:00 | 爱给网 | 免费 |

---

## 文件放置位置

```
miniprogram/
└── audio/
    ├── hit.mp3      ✅ (拳头音效)
    ├── slap.mp3     (拖鞋音效)
    ├── keyboard.mp3 (键盘音效)
    ├── hammer.mp3   (锤子音效)
    └── bgm.mp3      🆕 (背景音乐)
```

---

## 测试建议

1. **音量平衡**
   - BGM不应盖过打击音效
   - 建议BGM音量设为打击音效的 30-50%

2. **循环流畅性**
   - 确保音乐结尾和开头能自然衔接
   - 可以用淡入淡出处理

3. **真机测试**
   - 模拟器音质可能失真
   - 必须在真机上测试音质和音量

4. **性能测试**
   - BGM 不应影响点击响应速度
   - 检查内存占用

---

## 创意建议

### 进阶功能
- **多套BGM切换：** 让用户选择喜欢的音乐
- **动态音乐：** 根据连击速度改变节奏
- **情绪音乐：** 暴怒模式切换为激烈BGM
- **音效混音：** 打击音效和BGM自动调节音量

### 音乐彩蛋
- 累计1万伤害解锁隐藏BGM
- 特定时间段播放特殊BGM（如半夜播放恐怖音乐）
