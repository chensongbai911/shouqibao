/**
 * 成就系统模块
 * 管理所有成就的定义、解锁逻辑和状态
 *
 * @module achievement_system
 */

const cloudService = require('./cloud_service.js');
const syncManager = require('./sync_manager.js');

class AchievementSystem {
  constructor() {
    // 成就定义
    this.achievements = [
      {
        id: 'puncher',
        name: '出气王',
        description: '累计打击100次',
        icon: '👊',
        condition: { type: 'tap_count', value: 100 },
        reward: { score: 100, icon: '🏆' },
        rarity: 'common',
        unlocked: false,
        unlockedTime: null
      },
      {
        id: 'destroyer',
        name: '造成大伤害',
        description: '单次造成1000+伤害',
        icon: '💥',
        condition: { type: 'single_damage', value: 1000 },
        reward: { score: 500, icon: '⭐' },
        rarity: 'uncommon',
        unlocked: false,
        unlockedTime: null
      },
      {
        id: 'collector',
        name: '收藏家',
        description: '解锁3个不同的武器',
        icon: '🔓',
        condition: { type: 'unlock_weapons', value: 3 },
        reward: { score: 200, icon: '🎁' },
        rarity: 'uncommon',
        unlocked: false,
        unlockedTime: null
      },
      {
        id: 'beast',
        name: '连击之王',
        description: '达成10次连击',
        icon: '🔥',
        condition: { type: 'combo_count', value: 10 },
        reward: { score: 300, icon: '⭐' },
        rarity: 'rare',
        unlocked: false,
        unlockedTime: null
      },
      {
        id: 'wealthy',
        name: '富翁',
        description: '获得5000分',
        icon: '💰',
        condition: { type: 'total_score', value: 5000 },
        reward: { score: 1000, icon: '👑' },
        rarity: 'rare',
        unlocked: false,
        unlockedTime: null
      },
      {
        id: 'legend',
        name: '传奇',
        description: '解锁所有普通武器',
        icon: '⚡',
        condition: { type: 'unlock_all_weapons', value: 6 },
        reward: { score: 2000, icon: '👑' },
        rarity: 'epic',
        unlocked: false,
        unlockedTime: null
      }
    ];

    // 统计数据
    this.stats = {
      tapCount: 0,           // 总打击次数
      maxDamage: 0,          // 最大单次伤害
      unlockedWeapons: [],   // 已解锁武器
      maxCombo: 0            // 最大连击
    };
  }

  /**
   * 初始化成就系统
   */
  async init () {
    try {
      // 从云端加载已解锁的成就
      const unlockedAchievements = await cloudService.getUnlockedAchievements();

      for (const ach of this.achievements) {
        const found = unlockedAchievements.find(ua => ua.achievementId === ach.id);
        if (found) {
          ach.unlocked = true;
          ach.unlockedTime = found.unlockedAt;
        }
      }

      console.log(`✅ 成就系统已初始化，已解锁 ${unlockedAchievements.length} 个成就`);
    } catch (error) {
      console.warn('从云端加载成就失败，使用本地状态:', error);
      this._loadLocalAchievements();
    }
  }

  /**
   * 检查成就解锁条件
   * @param {Object} gameData - 游戏数据
   */
  async checkAchievements (gameData) {
    for (const achievement of this.achievements) {
      if (achievement.unlocked) continue;

      const shouldUnlock = this._checkCondition(achievement.condition, gameData);
      if (shouldUnlock) {
        await this.unlockAchievement(achievement.id);
      }
    }
  }

  /**
   * 检查单个条件
   * @private
   * @param {Object} condition - 解锁条件
   * @param {Object} gameData - 游戏数据
   * @returns {boolean}
   */
  _checkCondition (condition, gameData) {
    switch (condition.type) {
      case 'tap_count':
        return this.stats.tapCount >= condition.value;

      case 'single_damage':
        return gameData.lastDamage >= condition.value;

      case 'unlock_weapons':
        return this.stats.unlockedWeapons.length >= condition.value;

      case 'combo_count':
        return gameData.maxCombo >= condition.value;

      case 'total_score':
        return gameData.totalScore >= condition.value;

      case 'unlock_all_weapons':
        return this.stats.unlockedWeapons.length >= condition.value;

      default:
        return false;
    }
  }

  /**
   * 解锁成就
   * @param {string} achievementId - 成就ID
   * @param {Function} onUnlock - 解锁回调函数
   * @returns {Promise<boolean>}
   */
  async unlockAchievement (achievementId, onUnlock = null) {
    const achievement = this.achievements.find(a => a.id === achievementId);

    if (!achievement) {
      console.warn('未找到成就:', achievementId);
      return false;
    }

    if (achievement.unlocked) {
      console.log('成就已解锁:', achievementId);
      return false;
    }

    // 标记为已解锁
    achievement.unlocked = true;
    achievement.unlockedTime = new Date();

    // 播放解锁动画和音效
    if (onUnlock) {
      onUnlock(achievement);
    }

    // 保存到本地
    this._saveLocalAchievements();

    // 同步到云端
    try {
      await syncManager.unlockAchievement(achievementId);
      console.log(`✅ 成就已解锁并同步: ${achievement.name}`);
    } catch (error) {
      console.warn('成就同步失败:', error);
    }

    return true;
  }

  /**
   * 更新统计数据
   * @param {string} stat - 统计项名称
   * @param {any} value - 值
   */
  updateStat (stat, value) {
    switch (stat) {
      case 'tapCount':
        this.stats.tapCount++;
        break;

      case 'maxDamage':
        if (value > this.stats.maxDamage) {
          this.stats.maxDamage = value;
        }
        break;

      case 'unlockedWeapons':
        if (!this.stats.unlockedWeapons.includes(value)) {
          this.stats.unlockedWeapons.push(value);
        }
        break;

      case 'maxCombo':
        if (value > this.stats.maxCombo) {
          this.stats.maxCombo = value;
        }
        break;
    }
  }

  /**
   * 获取所有成就
   * @returns {Array}
   */
  getAllAchievements () {
    return this.achievements;
  }

  /**
   * 获取已解锁成就
   * @returns {Array}
   */
  getUnlockedAchievements () {
    return this.achievements.filter(a => a.unlocked);
  }

  /**
   * 获取成就进度
   * @returns {Object}
   */
  getProgress () {
    return {
      total: this.achievements.length,
      unlocked: this.getUnlockedAchievements().length,
      percentage: Math.round((this.getUnlockedAchievements().length / this.achievements.length) * 100)
    };
  }

  /**
   * 保存成就到本地
   * @private
   */
  _saveLocalAchievements () {
    try {
      wx.setStorageSync('achievements', this.achievements);
    } catch (error) {
      console.error('保存成就失败:', error);
    }
  }

  /**
   * 从本地加载成就
   * @private
   */
  _loadLocalAchievements () {
    try {
      const saved = wx.getStorageSync('achievements');
      if (saved) {
        this.achievements = saved;
      }
    } catch (error) {
      console.error('加载成就失败:', error);
    }
  }

  /**
   * 获取成就详情
   * @param {string} achievementId - 成就ID
   * @returns {Object|null}
   */
  getAchievementDetail (achievementId) {
    return this.achievements.find(a => a.id === achievementId) || null;
  }

  /**
   * 重置成就 (测试用)
   */
  resetAchievements () {
    this.achievements.forEach(a => {
      a.unlocked = false;
      a.unlockedTime = null;
    });
    wx.removeStorageSync('achievements');
    console.log('⚠️ 成就已重置');
  }
}

// 导出单例
const achievementSystem = new AchievementSystem();
module.exports = achievementSystem;
