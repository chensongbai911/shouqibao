/**
 * 游戏逻辑服务
 * 分离和集中管理游戏的核心逻辑
 */
class GameService {
  constructor(pageContext) {
    this.page = pageContext;
  }

  /**
   * 计算打击伤害
   */
  calculateDamage (weapon, isCrit, comboCount, rageMode, rageFactor = 1) {
    const comboDamageMultiplier = this.getComboDamageMultiplier(comboCount);
    const baseDamage = isCrit ? weapon.damage * 2 : weapon.damage;
    return Math.floor(baseDamage * rageFactor * comboDamageMultiplier);
  }

  /**
   * 计算连击伤害倍增系数
   */
  getComboDamageMultiplier (comboCount) {
    if (comboCount < 5) return 1.0;
    if (comboCount < 10) return 1.2;
    if (comboCount < 20) return 1.5;
    if (comboCount < 30) return 2.0;
    if (comboCount < 50) return 2.5;
    return 3.0;
  }

  /**
   * 检查成就解锁
   */
  checkAchievements (totalScore, unlockedWeaponCount, maxCombo) {
    const achievements = this.page.data.achievements;
    const newUnlocks = [];

    achievements.forEach(achievement => {
      if (achievement.unlocked) return;

      let shouldUnlock = false;

      if (achievement.type === 'weapon') {
        shouldUnlock = unlockedWeaponCount >= achievement.requirement;
      } else if (achievement.type === 'combo') {
        shouldUnlock = maxCombo >= achievement.requirement;
      } else {
        shouldUnlock = totalScore >= achievement.requirement;
      }

      if (shouldUnlock) {
        newUnlocks.push(achievement);
      }
    });

    return newUnlocks;
  }

  /**
   * 检查武器解锁
   */
  checkWeaponUnlock (totalScore, currentWeapon) {
    const unlockedWeapons = this.page.data.weapons.filter(w => w.unlockScore <= totalScore);
    const newWeapon = unlockedWeapons[unlockedWeapons.length - 1];

    return {
      allUnlocked: unlockedWeapons,
      latest: newWeapon,
      count: unlockedWeapons.length
    };
  }

  /**
   * 更新特殊武器解锁状态
   */
  updateSpecialWeaponsStatus (totalScore, achievements, shareCount, maxCombo) {
    return this.page.data.specialWeapons.map(weapon => {
      let unlocked = false;

      if (weapon.unlockType === 'achievement') {
        if (weapon.unlockCondition.includes('伤害')) {
          const required = parseInt(weapon.unlockCondition);
          unlocked = totalScore >= required;
        } else if (weapon.unlockCondition.includes('连击')) {
          const required = parseInt(weapon.unlockCondition);
          unlocked = maxCombo >= required;
        }
      } else if (weapon.unlockType === 'share') {
        const required = parseInt(weapon.unlockCondition);
        unlocked = shareCount >= required;
      }

      return { ...weapon, unlocked };
    });
  }

  /**
   * 保存游戏数据到本地存储
   */
  saveGameData (data) {
    wx.setStorageSync('totalScore', data.totalScore || 0);
    wx.setStorageSync('currentWeapon', data.currentWeapon?.id || 'hand');
    wx.setStorageSync('darkMode', data.darkMode || false);
    wx.setStorageSync('bgmPlaying', data.bgmPlaying || false);

    if (data.todayScore) {
      const todayKey = this.getTodayKey();
      wx.setStorageSync(todayKey, data.todayScore);
    }

    if (data.maxCombo) {
      wx.setStorageSync('maxCombo', data.maxCombo);
    }

    if (data.customFaceUrl) {
      wx.setStorageSync('customFaceUrl', data.customFaceUrl);
    }

    if (data.achievements) {
      wx.setStorageSync('achievements', data.achievements);
    }
  }

  /**
   * 加载游戏数据
   */
  loadGameData () {
    return {
      totalScore: wx.getStorageSync('totalScore') || 0,
      currentWeaponId: wx.getStorageSync('currentWeapon') || 'hand',
      todayScore: wx.getStorageSync(this.getTodayKey()) || 0,
      maxCombo: wx.getStorageSync('maxCombo') || 0,
      customFaceUrl: wx.getStorageSync('customFaceUrl') || '',
      darkMode: wx.getStorageSync('darkMode') || false,
      bgmPlaying: wx.getStorageSync('bgmPlaying') || false,
      achievements: wx.getStorageSync('achievements') || []
    };
  }

  /**
   * 获取今日存储键名
   */
  getTodayKey () {
    const now = new Date();
    return `todayScore_${now.getFullYear()}_${now.getMonth() + 1}_${now.getDate()}`;
  }
}

module.exports = GameService;
