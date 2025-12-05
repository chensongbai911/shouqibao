# 微信云开发配置指南

本文档说明如何配置和部署微信云开发环境。

## 📋 前置条件

- 已注册微信小程序
- 已获得小程序 AppID
- 小程序类目允许使用云开发

---

## 🌩️ 开通云开发环境

### Step 1: 登录微信公众平台

1. 访问 [微信公众平台](https://mp.weixin.qq.com/)
2. 使用管理员微信扫码登录
3. 进入小程序后台

### Step 2: 开通云开发

1. 点击左侧菜单 **开发** → **云开发**
2. 点击 **开通** 按钮
3. 填写环境名称（建议：`shouqibao-prod`）
4. 选择套餐（免费版即可）
5. 确认开通

### Step 3: 获取环境 ID

开通成功后，会显示环境 ID，格式如：`shouqibao-prod-xxxxx`

**请记录这个环境 ID，后续配置会用到。**

---

## 🔧 配置项目

### 1. 修改 App.vue

打开 `App.vue`，找到 `onLaunch` 函数，取消注释并填入你的环境 ID：

```javascript
onLaunch() {
  console.log('受气包解压小程序启动');

  // 初始化云开发环境
  wx.cloud.init({
    env: 'shouqibao-prod-xxxxx', // ← 替换为你的环境 ID
    traceUser: true
  });
}
```

### 2. 配置 manifest.json

确保 `manifest.json` 中配置了云函数根目录：

```json
{
  "mp-weixin": {
    "cloudfunctionRoot": "cloudfunctions/"
  }
}
```

---

## 📤 部署云函数

### 方法一：使用微信开发者工具（推荐）

1. 用微信开发者工具打开项目
2. 点击左侧 **云开发** 图标
3. 在云函数列表中找到 `getRanking` 和 `updateRanking`
4. 右键点击云函数文件夹，选择 **上传并部署：云端安装依赖**
5. 等待部署完成（首次部署需要 1-2 分钟）

### 方法二：使用命令行工具

```bash
# 安装云开发 CLI
npm install -g @cloudbase/cli

# 登录
tcb login

# 部署云函数
tcb functions:deploy getRanking
tcb functions:deploy updateRanking
```

---

## 🗄️ 创建数据库集合

### Step 1: 进入云开发控制台

1. 微信开发者工具 → 点击 **云开发** 按钮
2. 或访问 [云开发控制台](https://console.cloud.tencent.com/tcb)

### Step 2: 创建集合

1. 点击 **数据库** 标签
2. 点击 **添加集合**
3. 集合名称填写：`rankings`
4. 点击 **确定**

### Step 3: 设置权限（重要！）

默认情况下，集合权限为"仅创建者可读写"，需要修改：

1. 点击 `rankings` 集合
2. 点击 **权限设置** 标签
3. 选择 **所有用户可读，仅创建者可写**
4. 或自定义安全规则：

```json
{
  "read": true,
  "write": "doc._openid == auth.openid"
}
```

---

## 🧪 测试云函数

### 在微信开发者工具中测试

1. 打开微信开发者工具
2. 点击顶部 **云开发** → **云函数**
3. 选择 `getRanking` 云函数
4. 点击 **云端测试**
5. 输入测试参数（留空即可）
6. 点击 **调用**，查看返回结果

预期返回：
```json
{
  "code": 0,
  "message": "success",
  "data": []
}
```

### 测试 updateRanking

参数示例：
```json
{
  "score": 9999,
  "nickname": "测试玩家",
  "avatarUrl": ""
}
```

---

## 📊 数据库索引优化

为了提升排行榜查询性能，建议创建索引：

### 创建索引步骤

1. 进入云开发控制台 → 数据库
2. 选择 `rankings` 集合
3. 点击 **索引管理**
4. 点击 **添加索引**

### 推荐索引配置

| 字段名 | 类型 | 方向 |
|--------|------|------|
| date | String | 降序 |
| score | Number | 降序 |

组合索引：`{ date: -1, score: -1 }`

---

## 🔒 安全规则示例

为了防止恶意刷分，可以设置更严格的安全规则：

```json
{
  "read": true,
  "write": "doc._openid == auth.openid && newData.score <= 999999"
}
```

这样可以：
- 所有用户都能读取排行榜
- 只能修改自己的记录
- 分数上限为 999999

---

## 🐛 常见问题

### 1. 云函数调用失败

**错误**：`cloud.callFunction is not a function`

**解决方案**：
- 检查 `wx.cloud.init()` 是否在 `App.onLaunch` 中调用
- 确认环境 ID 填写正确
- 在真机或开发者工具中测试

### 2. 权限错误

**错误**：`Permission denied`

**解决方案**：
- 检查数据库集合的权限设置
- 确认用户已登录（有 openid）

### 3. 云函数超时

**解决方案**：
- 检查数据库查询是否有索引
- 优化查询条件
- 增加云函数超时时间（最大 60 秒）

---

## 💰 免费额度说明

微信云开发免费版包含：

| 资源 | 免费额度 |
|------|----------|
| 数据库容量 | 2GB |
| 数据库读操作 | 5万次/天 |
| 数据库写操作 | 3万次/天 |
| 云存储容量 | 5GB |
| 云函数调用 | 10万次/月 |
| 云函数资源使用 | 4万GBs/月 |

对于个人项目完全够用！

---

## 📚 参考资源

- [微信云开发官方文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [云函数开发指南](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions.html)
- [数据库使用指南](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/database.html)
