// app.js
App({
  onLaunch () {
    console.log('受气包小程序启动');

    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;

    console.log('设备信息:', systemInfo);
  },

  globalData: {
    systemInfo: null
  }
})
