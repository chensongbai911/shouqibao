// pages/index/index.js
const AudioPool = require('../../utils/audio_pool.js');

Page({
  data: {
    // 分数系统
    totalScore: 0,
    comboCount: 0,
    comboTimer: null,

    // 武器系统
    currentWeapon: {
      id: 'hand',
      name: '徒手',
      damage: 10,
      icon: '👋',
      unlockScore: 0
    },
    weapons: [
      { id: 'hand', name: '徒手', damage: 10, icon: '👋', unlockScore: 0 },
      { id: 'keyboard', name: '键盘', damage: 20, icon: '⌨️', unlockScore: 100 },
      { id: 'hammer', name: '锤子', damage: 50, icon: '🔨', unlockScore: 500 },
      { id: 'baseball', name: '棒球棍', damage: 100, icon: '⚾', unlockScore: 1000 }
    ],

    // 表情系统
    bagExpression: 'normal',
    expressionTimer: null,

    // 粒子特效系统
    particles: [],
    nextParticleId: 0,

    // UI模式
    darkMode: false,
    bgmPlaying: false,

    // 受击动画
    bagShaking: false,

    // 伤害飘字
    damageTexts: [],

    // 暴怒模式
    rageMode: false,
    rageModeTimer: null,
    lastClickTime: 0,
    clickCount: 0,

    // 自定义头像
    useCustomFace: false,
    customFaceUrl: ''
  },

  audioPool: null,
  bgmAudioContext: null,
  idleTimer: null,

  /**
   * 页面加载
   */
  onLoad () {
    console.log('首页加载');

    // 初始化音频池
    this.audioPool = new AudioPool();

    // 加载存储的数据
    this.loadGameData();

    // 初始化UI模式
    this.initUIMode();

    // 初始化背景音乐
    this.initBGM();

    // 启动空闲计时器
    this.startIdleTimer();
  },

  /**
   * 加载游戏数据
   */
  loadGameData () {
    const totalScore = wx.getStorageSync('totalScore') || 0;
    const currentWeaponId = wx.getStorageSync('currentWeapon') || 'hand';
    const customFaceUrl = wx.getStorageSync('customFaceUrl') || '';

    const currentWeapon = this.data.weapons.find(w => w.id === currentWeaponId) || this.data.weapons[0];

    this.setData({
      totalScore,
      currentWeapon,
      useCustomFace: !!customFaceUrl,
      customFaceUrl
    });
  },

  /**
   * 初始化UI模式
   */
  initUIMode () {
    const darkMode = wx.getStorageSync('darkMode') || false;
    this.setData({ darkMode });
  },

  /**
   * 初始化背景音乐
   */
  initBGM () {
    this.bgmAudioContext = wx.createInnerAudioContext();
    this.bgmAudioContext.src = '/audio/bgm.mp3';
    this.bgmAudioContext.loop = true;
    this.bgmAudioContext.volume = 0.3;

    const bgmPlaying = wx.getStorageSync('bgmPlaying') || false;
    this.setData({ bgmPlaying });

    if (bgmPlaying) {
      this.bgmAudioContext.play();
    }

    this.bgmAudioContext.onError((err) => {
      console.warn('BGM播放失败:', err);
    });
  },

  /**
   * 点击受气包（核心功能）
   */
  onBagTap (e) {
    console.log('点击受气包', e);

    const damage = this.data.currentWeapon.damage;
    const isCrit = Math.random() < 0.15; // 15% 暴击率

    // 重置空闲计时器
    this.resetIdleTimer();

    // 检测连续点击（暴怒模式）
    this.checkRageMode();

    // 1. 计算伤害
    const rageFactor = this.data.rageMode ? 2 : 1;
    const actualDamage = Math.floor(isCrit ? damage * 2 * rageFactor : damage * rageFactor);
    const newScore = this.data.totalScore + actualDamage;

    this.setData({
      totalScore: newScore
    });

    wx.setStorageSync('totalScore', newScore);

    // 2. 切换表情
    this.changeBagExpression(isCrit);

    // 3. 显示受击动画
    this.showHitAnimation();

    // 4. 播放音效
    this.playHitSound();

    // 5. 震动反馈
    this.vibratePhone(isCrit);

    // 6. 显示伤害飘字
    const position = this.getTouchPosition(e);
    this.showDamageText(actualDamage, position, isCrit);

    // 7. 生成粒子特效
    this.createParticles(position, isCrit);

    // 8. 检查武器解锁
    this.checkWeaponUnlock(newScore);

    // 9. 更新连击
    this.updateCombo();
  },

  /**
   * 触摸开始（用于获取准确位置）
   */
  onTouchStart (e) {
    // 预留接口，可用于长按等交互
  },

  /**
   * 切换受气包表情
   */
  changeBagExpression (isCrit) {
    if (this.expressionTimer) {
      clearTimeout(this.expressionTimer);
    }

    let expression = 'hit';
    let duration = 300;

    if (isCrit) {
      expression = 'crit';
      duration = 500;
    }

    // 累计伤害超过1000时，有20%概率昏迷
    if (this.data.totalScore > 1000 && Math.random() < 0.2) {
      expression = 'dizzy';
      duration = 1000;
    }

    this.setData({ bagExpression: expression });

    this.expressionTimer = setTimeout(() => {
      this.setData({ bagExpression: 'normal' });
    }, duration);
  },

  /**
   * 显示受击动画
   */
  showHitAnimation () {
    this.setData({ bagShaking: true });

    setTimeout(() => {
      this.setData({ bagShaking: false });
    }, 300);
  },

  /**
   * 播放受击音效
   */
  playHitSound () {
    const weaponId = this.data.currentWeapon.id;
    const soundMap = {
      'hand': '/audio/slap.mp3',
      'keyboard': '/audio/keyboard.mp3',
      'hammer': '/audio/hammer.mp3',
      'baseball': '/audio/hit.mp3'
    };

    const soundPath = soundMap[weaponId] || '/audio/hit.mp3';

    if (this.audioPool) {
      this.audioPool.play(soundPath);
    } else {
      const audio = wx.createInnerAudioContext();
      audio.src = soundPath;
      audio.play();
    }
  },

  /**
   * 震动反馈
   */
  vibratePhone (isCrit) {
    wx.vibrateShort({
      type: isCrit ? 'heavy' : 'light'
    });
  },

  /**
   * 显示伤害飘字
   */
  showDamageText (damage, position, isCrit) {
    const damageTexts = this.data.damageTexts || [];
    const textId = Date.now() + Math.random();

    damageTexts.push({
      id: textId,
      value: damage,
      x: position.x,
      y: position.y,
      isCrit: isCrit
    });

    this.setData({ damageTexts });

    setTimeout(() => {
      this.setData({
        damageTexts: this.data.damageTexts.filter(t => t.id !== textId)
      });
    }, 1000);
  },

  /**
   * 创建粒子特效
   */
  createParticles (position, isCrit) {
    const particleCount = isCrit ? 12 : 6;
    const newParticles = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 100 + Math.random() * 100;
      const size = isCrit ? 30 + Math.random() * 20 : 20 + Math.random() * 10;

      newParticles.push({
        id: this.data.nextParticleId++,
        x: position.x,
        y: position.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size,
        color: isCrit ? '#FF4500' : '#FFD700',
        rotation: Math.random() * 360
      });
    }

    this.setData({
      particles: [...this.data.particles, ...newParticles]
    });

    setTimeout(() => {
      this.removeParticles(newParticles.map(p => p.id));
    }, 600);
  },

  /**
   * 移除粒子
   */
  removeParticles (ids) {
    this.setData({
      particles: this.data.particles.filter(p => !ids.includes(p.id))
    });
  },

  /**
   * 获取触摸位置
   */
  getTouchPosition (e) {
    if (e.detail && (e.detail.x || e.detail.y)) {
      return {
        x: e.detail.x,
        y: e.detail.y
      };
    }
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].pageX,
        y: e.touches[0].pageY
      };
    }
    return {
      x: 375,
      y: 400
    };
  },

  /**
   * 检测暴怒模式
   */
  checkRageMode () {
    const now = Date.now();
    const timeDiff = now - this.data.lastClickTime;

    if (timeDiff < 500) {
      this.setData({
        clickCount: this.data.clickCount + 1
      });

      if (this.data.clickCount >= 10 && !this.data.rageMode) {
        this.activateRageMode();
      }
    } else {
      this.setData({
        clickCount: 1
      });
    }

    this.setData({
      lastClickTime: now
    });
  },

  /**
   * 激活暴怒模式
   */
  activateRageMode () {
    this.setData({ rageMode: true });

    wx.showToast({
      title: '🔥 暴怒模式！',
      icon: 'none'
    });

    if (this.rageModeTimer) {
      clearTimeout(this.rageModeTimer);
    }

    this.rageModeTimer = setTimeout(() => {
      this.setData({ rageMode: false });
    }, 5000);
  },

  /**
   * 更新连击
   */
  updateCombo () {
    if (this.comboTimer) {
      clearTimeout(this.comboTimer);
    }

    this.setData({
      comboCount: this.data.comboCount + 1
    });

    this.comboTimer = setTimeout(() => {
      this.setData({ comboCount: 0 });
    }, 1000);
  },

  /**
   * 检查武器解锁
   */
  checkWeaponUnlock (score) {
    const unlockedWeapons = this.data.weapons.filter(w => w.unlockScore <= score);
    const newWeapon = unlockedWeapons[unlockedWeapons.length - 1];

    // 检查是否有新武器解锁
    this.data.weapons.forEach(weapon => {
      if (weapon.unlockScore <= score && weapon.unlockScore > (score - this.data.currentWeapon.damage * 2)) {
        if (weapon.id !== 'hand') {
          wx.showToast({
            title: `🎉 解锁 ${weapon.name}！`,
            icon: 'none'
          });
        }
      }
    });
  },

  /**
   * 切换武器
   */
  switchWeapon (e) {
    const weaponId = e.currentTarget.dataset.id;
    const weapon = this.data.weapons.find(w => w.id === weaponId);

    if (!weapon) return;

    // 检查是否解锁
    if (weapon.unlockScore > this.data.totalScore) {
      wx.showToast({
        title: `需要 ${weapon.unlockScore} 分解锁`,
        icon: 'none'
      });
      return;
    }

    this.setData({
      currentWeapon: weapon
    });

    wx.setStorageSync('currentWeapon', weaponId);

    wx.showToast({
      title: `切换至 ${weapon.name}`,
      icon: 'success'
    });
  },

  /**
   * 切换暗黑模式
   */
  toggleDarkMode () {
    const darkMode = !this.data.darkMode;
    this.setData({ darkMode });
    wx.setStorageSync('darkMode', darkMode);

    wx.showToast({
      title: darkMode ? '🌙 暗黑模式' : '☀️ 明亮模式',
      icon: 'none'
    });
  },

  /**
   * 切换BGM播放
   */
  toggleBGM () {
    const bgmPlaying = !this.data.bgmPlaying;
    this.setData({ bgmPlaying });
    wx.setStorageSync('bgmPlaying', bgmPlaying);

    if (bgmPlaying) {
      this.bgmAudioContext.play();
      wx.showToast({
        title: '🎵 BGM已开启',
        icon: 'none'
      });
    } else {
      this.bgmAudioContext.pause();
      wx.showToast({
        title: '🔇 BGM已关闭',
        icon: 'none'
      });
    }
  },

  /**
   * 重置分数
   */
  resetScore () {
    wx.showModal({
      title: '确认重置',
      content: '确定要重置所有分数吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            totalScore: 0,
            currentWeapon: this.data.weapons[0]
          });
          wx.setStorageSync('totalScore', 0);
          wx.setStorageSync('currentWeapon', 'hand');
          wx.showToast({
            title: '已重置',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 开始空闲计时器
   */
  startIdleTimer () {
    this.resetIdleTimer();
  },

  /**
   * 重置空闲计时器
   */
  resetIdleTimer () {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    this.idleTimer = setTimeout(() => {
      // 5秒无操作，可以触发彩蛋
      console.log('用户空闲');
    }, 5000);
  },

  /**
   * 选择自定义头像
   */
  chooseCustomFace () {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({
          useCustomFace: true,
          customFaceUrl: tempFilePath
        });
        wx.setStorageSync('customFaceUrl', tempFilePath);
        wx.showToast({
          title: '头像已更换',
          icon: 'success'
        });
      }
    });
  },

  /**
   * 重置头像
   */
  resetFace () {
    this.setData({
      useCustomFace: false,
      customFaceUrl: ''
    });
    wx.removeStorageSync('customFaceUrl');
    wx.showToast({
      title: '已恢复默认',
      icon: 'success'
    });
  },

  /**
   * 页面卸载
   */
  onUnload () {
    if (this.bgmAudioContext) {
      this.bgmAudioContext.stop();
      this.bgmAudioContext.destroy();
    }

    if (this.expressionTimer) {
      clearTimeout(this.expressionTimer);
    }

    if (this.rageModeTimer) {
      clearTimeout(this.rageModeTimer);
    }

    if (this.comboTimer) {
      clearTimeout(this.comboTimer);
    }

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
  }
})
