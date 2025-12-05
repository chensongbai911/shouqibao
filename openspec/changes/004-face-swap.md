# Change Proposal: 换脸功能

**提案编号:** 004
**创建日期:** 2025-12-05
**状态:** 待审核
**优先级:** P1 (重要)
**预计工期:** 0.5天

## 概述

实现自定义受气包表情功能，允许用户从相册选择照片替换受气包的脸部，打造个性化的"出气对象"，增强情绪宣泄的代入感和趣味性。

## 动机

### 问题陈述
- 默认受气包表情缺少个性化，代入感不足
- 用户希望对特定对象（如：烦人的老板、讨厌的人）进行情绪宣泄
- 缺少病毒式传播的社交分享点

### 用户价值
- 强烈的个性化体验，提升情绪释放效果
- 满足恶搞心理，增加娱乐性
- 易于截图分享，形成社交传播

## 详细设计

### 功能需求

#### 核心功能
- 点击"换脸"按钮，唤起相册选择
- 选择照片后，裁剪为圆形或方形
- 替换受气包的脸部区域
- 支持重置为默认表情

#### 交互流程
1. 用户点击右上角"换脸"图标（📷）
2. 调用 `wx.chooseImage()` 打开相册
3. 用户选择一张照片
4. 显示裁剪框，调整照片位置和大小
5. 点击"确认"，替换受气包表情
6. 保存到本地存储，下次打开保持

### 技术实现

#### 数据结构
```javascript
data: {
  customFaceUrl: '',      // 自定义头像URL（本地路径）
  useCustomFace: false,   // 是否使用自定义头像
  showCropDialog: false,  // 是否显示裁剪弹窗
  tempImagePath: ''       // 临时图片路径
}
```

#### 核心方法
```javascript
/**
 * 选择照片
 */
onChooseFace() {
  wx.chooseImage({
    count: 1,
    sizeType: ['compressed'],  // 压缩图
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempPath = res.tempFilePaths[0];
      this.setData({
        tempImagePath: tempPath,
        showCropDialog: true
      });
    },
    fail: (err) => {
      wx.showToast({
        title: '选择失败',
        icon: 'none'
      });
    }
  });
}

/**
 * 确认使用照片
 */
onConfirmFace() {
  const { tempImagePath } = this.data;

  // 保存到本地存储
  wx.setStorageSync('customFace', tempImagePath);

  this.setData({
    customFaceUrl: tempImagePath,
    useCustomFace: true,
    showCropDialog: false
  });

  wx.showToast({
    title: '换脸成功！',
    icon: 'success'
  });
}

/**
 * 重置为默认
 */
onResetFace() {
  wx.showModal({
    title: '提示',
    content: '确定要恢复默认表情吗？',
    success: (res) => {
      if (res.confirm) {
        wx.removeStorageSync('customFace');
        this.setData({
          customFaceUrl: '',
          useCustomFace: false
        });
      }
    }
  });
}

/**
 * 页面加载时恢复自定义头像
 */
onLoad() {
  const customFace = wx.getStorageSync('customFace');
  if (customFace) {
    this.setData({
      customFaceUrl: customFace,
      useCustomFace: true
    });
  }
}
```

### UI 设计

#### WXML 结构
```xml
<!-- 受气包图片（动态切换） -->
<image
  class="bag-image {{bagState}}"
  src="{{useCustomFace ? customFaceUrl : '/images/bag_normal.png'}}"
  mode="aspectFit"
  bindtap="onBagTap"/>

<!-- 换脸按钮 -->
<view class="face-swap-btn" bindtap="onChooseFace">
  <text>📷 换脸</text>
</view>

<!-- 重置按钮（仅自定义时显示） -->
<view wx:if="{{useCustomFace}}" class="reset-btn" bindtap="onResetFace">
  <text>↺ 重置</text>
</view>

<!-- 裁剪预览弹窗 -->
<view class="crop-dialog" wx:if="{{showCropDialog}}">
  <view class="dialog-mask" bindtap="onCancelCrop"></view>
  <view class="dialog-content">
    <text class="dialog-title">调整照片</text>

    <!-- 预览区域 -->
    <view class="preview-area">
      <image
        class="preview-image"
        src="{{tempImagePath}}"
        mode="aspectFill"/>
      <view class="crop-frame"></view>
    </view>

    <!-- 提示文字 -->
    <text class="tip">照片将替换受气包的脸部</text>

    <!-- 操作按钮 -->
    <view class="dialog-actions">
      <button class="cancel-btn" bindtap="onCancelCrop">取消</button>
      <button class="confirm-btn" bindtap="onConfirmFace">确认</button>
    </view>
  </view>
</view>
```

#### WXSS 样式
```css
/* 换脸按钮 */
.face-swap-btn {
  position: fixed;
  top: 100rpx;
  right: 30rpx;
  width: 120rpx;
  height: 60rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFF;
  font-size: 28rpx;
  box-shadow: 0 8rpx 16rpx rgba(102, 126, 234, 0.4);
}

/* 重置按钮 */
.reset-btn {
  position: fixed;
  top: 180rpx;
  right: 30rpx;
  width: 120rpx;
  height: 60rpx;
  background: #FF6B35;
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFF;
  font-size: 28rpx;
}

/* 裁剪弹窗 */
.crop-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
}

.dialog-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
}

.dialog-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600rpx;
  background: #FFF;
  border-radius: 30rpx;
  padding: 40rpx;
}

.dialog-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30rpx;
}

.preview-area {
  width: 520rpx;
  height: 520rpx;
  position: relative;
  margin: 0 auto 20rpx;
  border-radius: 20rpx;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.crop-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400rpx;
  height: 400rpx;
  border: 4rpx dashed #FFD700;
  border-radius: 50%;
  pointer-events: none;
}

.tip {
  display: block;
  text-align: center;
  font-size: 28rpx;
  color: #999;
  margin-bottom: 30rpx;
}

.dialog-actions {
  display: flex;
  gap: 20rpx;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 32rpx;
}

.cancel-btn {
  background: #F0F0F0;
  color: #666;
}

.confirm-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #FFF;
}

/* 自定义头像显示 */
.bag-image.custom {
  border-radius: 50%;
  border: 6rpx solid #FFD700;
}
```

## 影响范围

### 修改的文件
- `pages/index/index.wxml` - 添加换脸按钮和弹窗
- `pages/index/index.wxss` - 添加换脸相关样式
- `pages/index/index.js` - 添加换脸逻辑和本地存储

### 新增的文件
无

### 权限配置
```json
// app.json
{
  "permission": {
    "scope.writePhotosAlbum": {
      "desc": "保存换脸照片到相册"
    }
  }
}
```

## 测试计划

### 功能测试
- [ ] 点击换脸按钮正确唤起相册
- [ ] 选择照片后正确显示预览
- [ ] 确认后替换受气包表情
- [ ] 本地存储保存成功，重启应用保持自定义头像
- [ ] 重置按钮恢复默认表情

### 兼容性测试
- [ ] iOS 系统正常选择照片
- [ ] Android 系统正常选择照片
- [ ] 拒绝相册权限时显示引导

### 边界测试
- [ ] 选择超大图片（>5MB）自动压缩
- [ ] 选择非正方形照片正确裁剪
- [ ] 取消选择不影响当前状态

## 风险评估

### 技术风险
- **中等** - iOS/Android 相册权限差异
- **低** - 图片文件可能损坏或格式不支持

### 缓解措施
- 使用 `sizeType: ['compressed']` 自动压缩
- 添加图片加载失败的容错处理
- 引导用户授予相册权限

## 替代方案

### 方案A：使用 Canvas 实时合成（高级版）
- 优点：可实现人脸识别自动贴合
- 缺点：开发复杂度高，需要第三方 AI SDK

### 方案B：预设多个表情包（简化版）
- 优点：无需相册权限，实现简单
- 缺点：缺少个性化，吸引力低

## 验收标准

- [ ] 用户可以从相册选择照片
- [ ] 照片正确替换受气包表情
- [ ] 重启小程序后自定义头像保持
- [ ] 可以重置为默认表情
- [ ] 图片加载速度 < 500ms
- [ ] 不同尺寸照片都能正常显示

## 后续工作

1. 添加人脸识别，自动定位脸部区域
2. 支持手势缩放和拖动调整照片
3. 提供表情滤镜（如：丑化、美颜）
4. 云端保存自定义头像，跨设备同步

## 参考资料

- [微信小程序图片选择 API](https://developers.weixin.qq.com/miniprogram/dev/api/media/image/wx.chooseImage.html)
- [本地存储 API](https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.setStorageSync.html)
- 类似案例：《对我好一点》小程序换脸功能
