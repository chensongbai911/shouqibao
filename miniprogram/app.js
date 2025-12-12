// app.js
const cloudService = require('./utils/cloud_service.js');
const syncManager = require('./utils/sync_manager.js');

App({
  onLaunch () {
    console.log('受气包小程序启动');

    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;
    console.log('设备信息:', systemInfo);

    // 初始化云服务
    this._initCloudService();

    // 初始化同步管理器
    syncManager.init();
  },

  /**
   * 初始化云服务
   * @private
   */
  async _initCloudService () {
    try {
      // ✅ 云服务环境ID (已配置)
      const envId = 'cloud1-0g29mlsv3d4ca637'; // 配置完成

      const initialized = await cloudService.init(envId);

      if (initialized) {
        console.log('✅ 云服务初始化成功');
        this.globalData.cloudServiceReady = true;
      } else {
        console.warn('⚠️ 云服务初始化失败，游戏仍可离线运行');
        this.globalData.cloudServiceReady = false;
      }
    } catch (error) {
      console.error('❌ 初始化云服务异常:', error);
      this.globalData.cloudServiceReady = false;
    }
  },

  globalData: {
    systemInfo: null,
    cloudServiceReady: false
  }
})
