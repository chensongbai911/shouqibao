# 武器系统音效资源说明

## 新增音频文件（武器系统）

### 1. 拖鞋音效
- **文件名：** `slap.mp3`
- **描述：** 拖鞋拍打的"啪啪"声
- **参考音效：** slap sound, flip flop hit, slipper smack
- **推荐来源：**
  - Freesound: 搜索 "slap" 或 "whack"
  - 爱给网: 搜索 "拍打" 或 "啪"

### 2. 键盘音效
- **文件名：** `keyboard.mp3`
- **描述：** 机械键盘的敲击声（单击或连击）
- **参考音效：** mechanical keyboard, typing sound
- **推荐来源：**
  - Freesound: 搜索 "mechanical keyboard"
  - 爱给网: 搜索 "键盘" 或 "敲击"

### 3. 锤子音效
- **文件名：** `hammer.mp3`
- **描述：** 重锤砸击声，带混响
- **参考音效：** hammer hit, heavy impact, metal clang
- **推荐来源：**
  - Freesound: 搜索 "hammer metal" 或 "heavy hit"
  - 爱给网: 搜索 "锤子" 或 "重击"

## 音效特征建议

| 武器 | 音调 | 音量 | 时长 | 特点 |
|-----|------|------|------|------|
| 拳头 (hit.mp3) | 中 | 中 | 0.3-0.5s | 清脆 |
| 拖鞋 (slap.mp3) | 中低 | 中高 | 0.4-0.6s | 啪啪声，有点搞笑 |
| 键盘 (keyboard.mp3) | 高 | 中 | 0.2-0.4s | 脆响，机械感 |
| 锤子 (hammer.mp3) | 低 | 高 | 0.6-1.0s | 沉重，有回音 |

## 快速获取方法

### 方法 1：Freesound.org（推荐）
1. 访问 https://freesound.org/
2. 搜索对应关键词
3. 筛选：Creative Commons 0（完全免费）
4. 下载后转换为 MP3 格式

### 方法 2：爱给网
1. 访问 https://www.aigei.com/sound/
2. 搜索中文关键词
3. 选择免费音效
4. 下载并压缩到 < 50KB

### 方法 3：自己录制
- 使用手机录音，拍打真实物体
- 用 Audacity 剪辑和处理
- 导出为 MP3 格式

## 临时方案

如果暂时无法准备全部音效，可以：

1. **复用基础音效：** 将 `hit.mp3` 复制为其他音效名
2. **调整音调：** 用 Audacity 调整音调区分
3. **仅保留震动：** 武器切换只改变伤害值，暂不改变音效

## 文件放置位置

```
miniprogram/
└── audio/
    ├── hit.mp3      (已有)
    ├── slap.mp3     (新增)
    ├── keyboard.mp3 (新增)
    └── hammer.mp3   (新增)
```

## 测试建议

- 真机测试每种音效的音量是否合适
- 确保音效不会重叠或截断
- 锤子音效可以稍微响亮，体现"重武器"感觉
