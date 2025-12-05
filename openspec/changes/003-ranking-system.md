# Change Proposal: 排行榜系统

**提案编号:** 003
**创建日期:** 2025-12-05
**状态:** 待审核
**优先级:** P2 (增强)
**预计工期:** 1天

## 概述

实现全服排行榜功能，展示伤害排名前50的玩家，通过社交竞争激励用户持续游玩，增加用户留存和活跃度。

## 动机

### 问题陈述
- 当前版本缺少社交元素，用户孤立游玩
- 没有长期目标，用户容易流失
- 无法体现"高手"的成就感

### 用户价值
- 通过排名对比产生竞争动力
- 提供明确的努力目标（如：冲进前10）
- 满足炫耀心理（截图分享排名）

## 详细设计

### 功能需求

#### 排行榜类型
- **总伤害榜：** 累计造成的总伤害（主榜）
- **今日榜：** 当日伤害排名（后续版本）
- **好友榜：** 微信好友排名（后续版本）

#### 显示信息
| 字段 | 说明 |
|-----|------|
| 排名 | 1-50，前3名特殊图标 🥇🥈🥉 |
| 昵称 | 微信昵称（脱敏：显示前2字+***） |
| 头像 | 微信头像（圆形） |
| 总伤害 | 格式化显示（如：12,345 或 1.2万） |
| 我的排名 | 高亮显示，固定在底部 |

#### 交互流程
1. 点击顶部"排行榜"图标
2. 显示全屏排行榜页面
3. 加载前50名数据（Loading 动画）
4. 显示列表，自动滚动到自己的位置
5. 点击"返回"关闭排行榜

### 技术实现

#### 云数据库设计
```javascript
// users 集合
{
  _openid: String,        // 用户唯一标识
  nickName: String,       // 微信昵称
  avatarUrl: String,      // 微信头像URL
  totalScore: Number,     // 总伤害
  todayScore: Number,     // 今日伤害
  updateTime: Date,       // 最后更新时间
  createTime: Date        // 创建时间
}

// 索引
db.collection('users').createIndex({
  totalScore: -1  // 降序索引，加速排行查询
})
```

#### 云函数：getRanking
```javascript
// cloudfunctions/getRanking/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { type = 'total', limit = 50 } = event
  const wxContext = cloud.getWXContext()

  try {
    // 获取排行榜数据
    const result = await db.collection('users')
      .orderBy('totalScore', 'desc')
      .limit(limit)
      .get()

    // 获取当前用户排名
    const myData = await db.collection('users')
      .where({ _openid: wxContext.OPENID })
      .get()

    let myRank = -1
    if (myData.data.length > 0) {
      const myScore = myData.data[0].totalScore
      const countResult = await db.collection('users')
        .where({
          totalScore: db.command.gt(myScore)
        })
        .count()
      myRank = countResult.total + 1
    }

    return {
      success: true,
      data: result.data,
      myRank: myRank,
      myData: myData.data[0] || null
    }
  } catch (err) {
    return {
      success: false,
      errMsg: err.message
    }
  }
}
```

#### 前端页面逻辑
```javascript
// pages/ranking/ranking.js
Page({
  data: {
    rankingList: [],
    myRank: -1,
    myData: null,
    loading: true
  },

  onLoad() {
    this.loadRanking()
  },

  /**
   * 加载排行榜数据
   */
  async loadRanking() {
    wx.showLoading({ title: '加载中...' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'getRanking',
        data: { type: 'total', limit: 50 }
      })

      if (res.result.success) {
        this.setData({
          rankingList: res.result.data,
          myRank: res.result.myRank,
          myData: res.result.myData,
          loading: false
        })
      }
    } catch (err) {
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  /**
   * 格式化大数字
   */
  formatNumber(num) {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万'
    }
    return num.toLocaleString()
  }
})
```

### UI 设计

#### WXML 结构
```xml
<!-- pages/ranking/ranking.wxml -->
<view class="ranking-page">
  <!-- 顶部标题 -->
  <view class="header">
    <text class="title">🏆 排行榜</text>
    <view class="close-btn" bindtap="onClose">✕</view>
  </view>

  <!-- 加载中 -->
  <view wx:if="{{loading}}" class="loading">
    <image src="/images/loading.gif" mode="aspectFit"/>
  </view>

  <!-- 排行榜列表 -->
  <scroll-view wx:else class="ranking-list" scroll-y>
    <view
      wx:for="{{rankingList}}"
      wx:key="_id"
      class="rank-item {{index < 3 ? 'top-three' : ''}}">

      <!-- 排名 -->
      <view class="rank-number">
        <text wx:if="{{index === 0}}">🥇</text>
        <text wx:elif="{{index === 1}}">🥈</text>
        <text wx:elif="{{index === 2}}">🥉</text>
        <text wx:else>{{index + 1}}</text>
      </view>

      <!-- 头像 -->
      <image class="avatar" src="{{item.avatarUrl}}" mode="aspectFill"/>

      <!-- 昵称 -->
      <text class="nickname">{{item.nickName}}</text>

      <!-- 分数 -->
      <text class="score">{{formatNumber(item.totalScore)}}</text>
    </view>
  </scroll-view>

  <!-- 我的排名（固定底部） -->
  <view class="my-rank" wx:if="{{myData}}">
    <view class="rank-item highlight">
      <view class="rank-number">{{myRank}}</view>
      <image class="avatar" src="{{myData.avatarUrl}}" mode="aspectFill"/>
      <text class="nickname">我</text>
      <text class="score">{{formatNumber(myData.totalScore)}}</text>
    </view>
  </view>
</view>
```

#### WXSS 样式
```css
/* pages/ranking/ranking.wxss */
.ranking-page {
  width: 100%;
  height: 100vh;
  background: linear-gradient(180deg, #FFD23F 0%, #FF6B35 100%);
}

.header {
  height: 120rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #FFF;
}

.close-btn {
  position: absolute;
  right: 30rpx;
  width: 60rpx;
  height: 60rpx;
  background: rgba(0,0,0,0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFF;
  font-size: 40rpx;
}

.ranking-list {
  height: calc(100vh - 240rpx);
  padding: 20rpx;
}

.rank-item {
  height: 120rpx;
  background: #FFF;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}

.rank-item.top-three {
  background: linear-gradient(90deg, #FFF9E6 0%, #FFF 100%);
  border: 3rpx solid #FFD700;
}

.rank-number {
  width: 80rpx;
  font-size: 40rpx;
  font-weight: bold;
  color: #FF6B35;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin: 0 20rpx;
}

.nickname {
  flex: 1;
  font-size: 32rpx;
  color: #333;
}

.score {
  font-size: 36rpx;
  font-weight: bold;
  color: #FF6B35;
}

.my-rank {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx;
  background: rgba(255, 255, 255, 0.95);
  border-top: 2rpx solid #FFD700;
}

.rank-item.highlight {
  background: linear-gradient(90deg, #FFD700 0%, #FFF 100%);
  border: 4rpx solid #FF6B35;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}
```

## 影响范围

### 新增的文件
- `pages/ranking/ranking.js` - 排行榜页面逻辑
- `pages/ranking/ranking.wxml` - 排行榜页面结构
- `pages/ranking/ranking.wxss` - 排行榜页面样式
- `pages/ranking/ranking.json` - 页面配置
- `cloudfunctions/getRanking/index.js` - 获取排行榜云函数

### 修改的文件
- `app.json` - 添加排行榜页面路由
- `pages/index/index.wxml` - 添加排行榜入口按钮
- `pages/index/index.js` - 添加跳转逻辑

### 数据库变更
```javascript
// users 集合新增字段
{
  nickName: String,    // 新增
  avatarUrl: String,   // 新增
  todayScore: Number   // 新增
}

// 新增索引
totalScore: -1 (降序)
```

## 测试计划

### 功能测试
- [ ] 排行榜正确显示前50名
- [ ] 前3名显示特殊标识
- [ ] 我的排名正确计算并高亮
- [ ] 分数格式化正确（万位转换）
- [ ] 点击关闭按钮返回首页

### 性能测试
- [ ] 1000+ 用户数据查询速度 < 1s
- [ ] 排行榜页面加载速度 < 2s
- [ ] 滚动列表流畅不卡顿

### 边界测试
- [ ] 用户数量 < 50 时正常显示
- [ ] 新用户（未上榜）显示"未上榜"
- [ ] 网络异常时显示错误提示

## 风险评估

### 技术风险
- **中等** - 云数据库查询性能（用户量大时）
- **低** - 微信头像获取可能失败

### 缓解措施
- 添加数据库索引优化查询
- 使用缓存机制（5分钟更新一次）
- 头像加载失败时显示默认头像

## 替代方案

### 方案A：客户端计算排名（不推荐）
- 优点：无需云函数
- 缺点：需要下载全部数据，性能差

### 方案B：仅显示前10名（简化版）
- 优点：减少数据传输，加载更快
- 缺点：大部分用户看不到自己排名

## 验收标准

- [ ] 排行榜正确显示前50名玩家
- [ ] 前3名有特殊金银铜标识
- [ ] 当前用户排名固定在底部并高亮
- [ ] 分数格式化清晰易读
- [ ] 加载时显示 Loading 动画
- [ ] 页面流畅，响应速度 < 1s

## 后续工作

1. 添加"今日榜"和"好友榜"
2. 实现排名变化提示（如：↑5）
3. 添加排名奖励机制
4. 支持分享排名到微信

## 参考资料

- [微信云开发数据库查询](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/database/query.html)
- [微信开放数据组件](https://developers.weixin.qq.com/miniprogram/dev/component/open-data.html)
- 类似案例：《跳一跳》排行榜设计
