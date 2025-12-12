/**
 * 数据同步管理器
 * 处理本地缓存、网络状态检测、数据队列同步
 *
 * @module sync_manager
 */

const cloudService = require('./cloud_service.js');

class SyncManager {
  constructor() {
    this.syncQueue = [];           // 待同步队列
    this.isOnline = true;           // 网络状态
    this.lastSyncTime = 0;          // 最后同步时间
    this.syncInterval = 5000;       // 同步间隔 (5秒)
    this.isSyncing = false;         // 是否正在同步
    this.pendingUpdates = null;     // 待处理的更新
    this.syncTimer = null;          // 同步定时器
  }

  /**
   * 初始化同步管理器
   */
  init () {
    this._initNetworkListener();
    console.log('✅ 同步管理器已初始化');
  }

  /**
   * 监听网络状态变化
   * @private
   */
  _initNetworkListener () {
    // 初始网络状态检查
    wx.getNetworkType({
      success: res => {
        this.isOnline = res.networkType !== 'none';
        console.log('初始网络状态:', res.networkType);
      }
    });

    // 监听网络状态变化
    wx.onNetworkStatusChange(res => {
      const wasOnline = this.isOnline;
      this.isOnline = res.isConnected;

      console.log(`网络状态变化: ${wasOnline ? '在线' : '离线'} → ${this.isOnline ? '在线' : '离线'}`);

      if (!wasOnline && this.isOnline) {
        // 从离线恢复到在线
        console.log('✅ 网络恢复，开始同步待处理数据');
        this._syncAll();
      } else if (wasOnline && !this.isOnline) {
        // 从在线切换到离线
        console.log('⚠️ 网络断开，进入离线模式');
      }
    });
  }

  /**
   * 保存分数 (支持离线)
   * @param {number} score - 新分数
   * @returns {Promise<void>}
   */
  async saveScore (score) {
    // 先保存到本地缓存
    const cache = {
      score: score,
      timestamp: Date.now()
    };
    wx.setStorageSync('lastScore', cache);

    // 记录为待更新项
    this.pendingUpdates = {
      totalScore: score,
      lastUpdateTime: new Date()
    };

    // 如果在线，立即同步到云端
    if (this.isOnline) {
      try {
        await cloudService.updateScore(score);
        this.lastSyncTime = Date.now();
        console.log('✅ 分数已实时同步到云端');
      } catch (error) {
        console.warn('分数同步失败，加入队列:', error);
        this._addToQueue({
          type: 'updateScore',
          data: score,
          timestamp: Date.now()
        });
      }
    } else {
      // 离线状态，加入队列
      console.log('📦 离线模式：分数加入同步队列');
      this._addToQueue({
        type: 'updateScore',
        data: score,
        timestamp: Date.now()
      });
    }
  }

  /**
   * 解锁成就
   * @param {string} achievementId - 成就ID
   * @returns {Promise<void>}
   */
  async unlockAchievement (achievementId) {
    if (this.isOnline) {
      try {
        await cloudService.unlockAchievement(achievementId);
        console.log('✅ 成就已同步到云端');
      } catch (error) {
        console.warn('成就同步失败，加入队列:', error);
        this._addToQueue({
          type: 'unlockAchievement',
          data: achievementId,
          timestamp: Date.now()
        });
      }
    } else {
      console.log('📦 离线模式：成就加入同步队列');
      this._addToQueue({
        type: 'unlockAchievement',
        data: achievementId,
        timestamp: Date.now()
      });
    }
  }

  /**
   * 添加到同步队列
   * @private
   * @param {Object} item - 队列项
   */
  _addToQueue (item) {
    // 检查是否已存在相同类型的项
    const existingIndex = this.syncQueue.findIndex(
      q => q.type === item.type && q.data === item.data
    );

    if (existingIndex === -1) {
      this.syncQueue.push(item);
      console.log(`队列大小: ${this.syncQueue.length}`);
    }
  }

  /**
   * 同步所有待处理项
   * @private
   */
  async _syncAll () {
    if (!this.isOnline || this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    console.log(`🔄 开始同步 ${this.syncQueue.length} 项`);

    const itemsToSync = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of itemsToSync) {
      try {
        switch (item.type) {
          case 'updateScore':
            await cloudService.updateScore(item.data);
            console.log('✅ 已同步分数');
            break;

          case 'unlockAchievement':
            await cloudService.unlockAchievement(item.data);
            console.log('✅ 已同步成就');
            break;

          default:
            console.warn('未知的同步类型:', item.type);
        }
      } catch (error) {
        console.error('同步失败，重新加入队列:', error);
        this._addToQueue(item);
      }
    }

    this.isSyncing = false;
    this.lastSyncTime = Date.now();
    console.log(`✅ 同步完成，剩余 ${this.syncQueue.length} 项`);
  }

  /**
   * 从本地恢复数据
   * @returns {Object|null}
   */
  restoreLocalData () {
    try {
      const lastScore = wx.getStorageSync('lastScore');
      return lastScore || null;
    } catch (error) {
      console.error('恢复本地数据失败:', error);
      return null;
    }
  }

  /**
   * 获取同步状态
   * @returns {Object}
   */
  getStatus () {
    return {
      isOnline: this.isOnline,
      queueSize: this.syncQueue.length,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      hasLocalData: !!this.restoreLocalData()
    };
  }

  /**
   * 获取网络状态文本
   * @returns {string}
   */
  getNetworkStatus () {
    return this.isOnline ? '在线' : '离线';
  }

  /**
   * 手动触发同步
   * @returns {Promise<void>}
   */
  async manualSync () {
    console.log('👤 手动触发同步');
    await this._syncAll();
  }

  /**
   * 清空同步队列
   */
  clearQueue () {
    this.syncQueue = [];
    console.log('🗑️ 同步队列已清空');
  }

  /**
   * 销毁管理器
   */
  destroy () {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }
    console.log('同步管理器已销毁');
  }
}

// 导出单例
const syncManager = new SyncManager();
module.exports = syncManager;
