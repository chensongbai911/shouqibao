import { defineStore } from 'pinia';

export const useGameStore = defineStore('game', {
  state: () => ({
    // 分数系统
    currentScore: 0,
    totalClicks: 0,
    comboCount: 0,

    // 武器系统
    currentWeapon: 'fist',
    weapons: [
      {
        id: 'fist',
        name: '拳头',
        icon: '👊',
        damageMultiplier: 1,
        audioSrc: '/static/audio/punch.mp3'
      },
      {
        id: 'slipper',
        name: '拖鞋',
        icon: '🩴',
        damageMultiplier: 1,
        audioSrc: '/static/audio/slap.mp3'
      },
      {
        id: 'pan',
        name: '平底锅',
        icon: '🍳',
        damageMultiplier: 1.2,
        audioSrc: '/static/audio/pan.mp3'
      }
    ],

    // 设置
    isMuted: false,
    isVibrationEnabled: true,

    // 用户自定义
    customFaceUrl: null
  }),

  getters: {
    getCurrentWeapon (state) {
      return state.weapons.find(w => w.id === state.currentWeapon);
    },

    getDamage (state) {
      const weapon = state.weapons.find(w => w.id === state.currentWeapon);
      const baseDamage = 10;
      const isCritical = Math.random() < 0.2; // 20% 暴击率
      const damage = baseDamage * (weapon?.damageMultiplier || 1);

      return {
        value: isCritical ? damage * 2 : damage,
        isCritical
      };
    }
  },

  actions: {
    // 点击受气包
    hit () {
      this.totalClicks++;
      this.comboCount++;

      const { value, isCritical } = this.getDamage;
      this.currentScore += value;

      return { damage: value, isCritical };
    },

    // 重置连击
    resetCombo () {
      this.comboCount = 0;
    },

    // 切换武器
    switchWeapon (weaponId) {
      const weapon = this.weapons.find(w => w.id === weaponId);
      if (weapon) {
        this.currentWeapon = weaponId;
      }
    },

    // 切换静音
    toggleMute () {
      this.isMuted = !this.isMuted;
    },

    // 切换震动
    toggleVibration () {
      this.isVibrationEnabled = !this.isVibrationEnabled;
    },

    // 设置自定义头像
    setCustomFace (url) {
      this.customFaceUrl = url;
    },

    // 重置游戏
    reset () {
      this.currentScore = 0;
      this.totalClicks = 0;
      this.comboCount = 0;
    }
  }
});
