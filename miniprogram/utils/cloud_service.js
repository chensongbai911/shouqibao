/**
 * 云服务封装模块
 * 统一管理所有云数据库操作和同步
 *
 * @module cloud_service
 * @requires wx.cloud
 */

class CloudService {
  constructor() {
    this.db = null;
    this.userId = null;
    this.isInitialized = false;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  /**
   * 初始化云服务
   * @param {string} envId - 云开发环境ID
   * @returns {Promise<boolean>}
   */
  async init (envId) {
    try {
      if (!wx.cloud) {
        console.error('云开发不可用');
        return false;
      }

      wx.cloud.init({
        env: envId,
        traceUser: true
      });

      this.db = wx.cloud.database();
      await this.getUserId();
      this.isInitialized = true;

      console.log('✅ 云服务初始化成功');
      return true;
    } catch (error) {
      console.error('❌ 云服务初始化失败:', error);
      return false;
    }
  }

  /**
   * 获取用户OpenID
   * @private
   * @returns {Promise<void>}
   */
  async getUserId () {
    const cachedUserId = wx.getStorageSync('userId');

    return new Promise((resolve, reject) => {
      try {
        wx.cloud.callFunction({
          name: 'login',
          data: {},
          success: res => {
            if (res && res.result && res.result.openid) {
              this.userId = res.result.openid;
              wx.setStorageSync('userId', this.userId);
              console.log('用户ID获取成功');
              resolve(this.userId);
            } else {
              console.warn('云函数返回数据异常，使用备用用户ID');
              const fallbackId = this._useFallbackUserId('login function returned empty result', cachedUserId);
              resolve(fallbackId);
            }
          },
          fail: err => {
            console.error('获取用户ID失败:', err);
            const fallbackId = this._useFallbackUserId(err, cachedUserId);
            resolve(fallbackId);
          }
        });
      } catch (error) {
        console.error('调用云函数异常:', error);
        const fallbackId = this._useFallbackUserId(error, cachedUserId);
        resolve(fallbackId);
      }
    });
  }

  /**
   * 使用备用用户ID
   * @private
   * @param {Error|string} reason
   * @param {string|null} cachedUserId
   * @returns {string}
   */
  _useFallbackUserId (reason, cachedUserId) {
    if (cachedUserId) {
      this.userId = cachedUserId;
      console.warn('使用缓存用户ID:', cachedUserId, '原因:', reason);
      return cachedUserId;
    }

    const fallbackId = 'anonymous_' + Date.now();
    this.userId = fallbackId;
    wx.setStorageSync('userId', fallbackId);
    console.warn('使用新生成的备用用户ID:', fallbackId, '原因:', reason);
    return fallbackId;
  }

  /**
   * 保存用户数据
   * @param {Object} data - 要保存的数据
   * @returns {Promise<Object>}
   */
  async saveUserData (data) {
    if (!this.isInitialized) {
      throw new Error('云服务未初始化');
    }

    try {
      // 先查询是否存在
      const queryRes = await this._query('user_data', {
        userId: this.userId
      });

      if (queryRes.length > 0) {
        // 更新现有记录
        return this._update('user_data', queryRes[0]._id, {
          ...data,
          lastUpdateTime: new Date()
        });
      } else {
        // 新增记录
        return this._add('user_data', {
          userId: this.userId,
          ...data,
          createTime: new Date(),
          lastUpdateTime: new Date()
        });
      }
    } catch (error) {
      console.error('保存用户数据失败:', error);
      throw error;
    }
  }

  /**
   * 加载用户数据
   * @returns {Promise<Object|null>}
   */
  async loadUserData () {
    if (!this.isInitialized) {
      throw new Error('云服务未初始化');
    }

    try {
      const results = await this._query('user_data', {
        userId: this.userId
      });

      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('加载用户数据失败:', error);
      return null;
    }
  }

  /**
   * 更新分数
   * @param {number} newScore - 新分数
   * @returns {Promise<Object>}
   */
  async updateScore (newScore) {
    return this.saveUserData({
      totalScore: newScore,
      lastUpdateTime: new Date()
    });
  }

  /**
   * 解锁成就
   * @param {string} achievementId - 成就ID
   * @returns {Promise<Object>}
   */
  async unlockAchievement (achievementId) {
    if (!this.isInitialized) {
      throw new Error('云服务未初始化');
    }

    try {
      // 先检查是否已解锁
      const results = await this._query('achievements', {
        userId: this.userId,
        achievementId: achievementId
      });

      if (results.length > 0) {
        console.log('成就已解锁，跳过');
        return results[0];
      }

      return this._add('achievements', {
        userId: this.userId,
        achievementId: achievementId,
        unlockedAt: new Date(),
        progress: 100
      });
    } catch (error) {
      console.error('解锁成就失败:', error);
      throw error;
    }
  }

  /**
   * 查询已解锁的成就
   * @returns {Promise<Array>}
   */
  async getUnlockedAchievements () {
    if (!this.isInitialized) {
      throw new Error('云服务未初始化');
    }

    try {
      return await this._query('achievements', {
        userId: this.userId
      });
    } catch (error) {
      console.error('查询成就失败:', error);
      return [];
    }
  }

  /**
   * 查询排行榜 (前N名)
   * @param {number} limit - 限制数量，默认100
   * @returns {Promise<Array>}
   */
  async getLeaderboard (limit = 100) {
    if (!this.isInitialized) {
      throw new Error('云服务未初始化');
    }

    try {
      return new Promise((resolve, reject) => {
        this.db.collection('leaderboard')
          .orderBy('score', 'desc')
          .limit(limit)
          .get({
            success: res => {
              resolve(res.data);
            },
            fail: err => {
              reject(err);
            }
          });
      });
    } catch (error) {
      console.error('查询排行榜失败:', error);
      return [];
    }
  }

  /**
   * 获取用户排名
   * @returns {Promise<Object|null>}
   */
  async getUserRank () {
    if (!this.isInitialized) {
      throw new Error('云服务未初始化');
    }

    try {
      const results = await this._query('leaderboard', {
        userId: this.userId
      });

      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('获取用户排名失败:', error);
      return null;
    }
  }

  /**
   * 更新排行榜 (内部使用)
   * @private
   * @param {number} score - 分数
   * @returns {Promise<Object>}
   */
  async _updateLeaderboard (score) {
    try {
      const results = await this._query('leaderboard', {
        userId: this.userId
      });

      if (results.length > 0) {
        return this._update('leaderboard', results[0]._id, {
          score: score,
          updateTime: new Date()
        });
      } else {
        return this._add('leaderboard', {
          userId: this.userId,
          score: score,
          createTime: new Date(),
          updateTime: new Date()
        });
      }
    } catch (error) {
      console.error('更新排行榜失败:', error);
      throw error;
    }
  }

  /**
   * 数据库查询 (内部方法)
   * @private
   * @param {string} collection - 集合名
   * @param {Object} query - 查询条件
   * @returns {Promise<Array>}
   */
  _query (collection, query) {
    return new Promise((resolve, reject) => {
      this.db.collection(collection)
        .where(query)
        .get({
          success: res => {
            resolve(res.data);
          },
          fail: err => {
            reject(err);
          }
        });
    });
  }

  /**
   * 数据库新增 (内部方法)
   * @private
   * @param {string} collection - 集合名
   * @param {Object} data - 数据
   * @returns {Promise<Object>}
   */
  _add (collection, data) {
    return new Promise((resolve, reject) => {
      this.db.collection(collection).add({
        data: data,
        success: res => {
          resolve(res);
        },
        fail: err => {
          reject(err);
        }
      });
    });
  }

  /**
   * 数据库更新 (内部方法)
   * @private
   * @param {string} collection - 集合名
   * @param {string} docId - 文档ID
   * @param {Object} data - 更新数据
   * @returns {Promise<Object>}
   */
  _update (collection, docId, data) {
    return new Promise((resolve, reject) => {
      this.db.collection(collection).doc(docId).update({
        data: data,
        success: res => {
          resolve(res);
        },
        fail: err => {
          reject(err);
        }
      });
    });
  }

  /**
   * 健康检查
   * @returns {boolean}
   */
  isReady () {
    return this.isInitialized && this.userId !== null;
  }

  /**
   * 获取连接状态
   * @returns {string}
   */
  getStatus () {
    if (!this.isInitialized) return 'uninitialized';
    if (!this.userId) return 'no_user_id';
    return 'ready';
  }
}

// 导出单例
const cloudService = new CloudService();
module.exports = cloudService;
