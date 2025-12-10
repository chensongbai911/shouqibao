// pages/index/index.js
const AudioPool = require('../../utils/audio_pool.js');
const Bag3DRenderer = require('../../utils/bag_3d.js');

Page({
  data: {
    // 导航栏
    statusBarHeight: 20,

    // 分数系统
    totalScore: 0,
    todayScore: 0,      // 今日伤害
    comboCount: 0,
    comboTimer: null,

    // 武器系统
    currentWeapon: {
      id: 'hand',
      name: '铁拳',
      damage: 10,
      icon: '👊',
      unlockScore: 0,
      rarity: 'common',        // 稀有度
      attackStars: 1,          // 攻击力星级
      speedStars: 3,           // 攻速星级
      critStars: 1,            // 暴击星级
      description: '最基础的武器，但永远可靠'
    },
    weapons: [
      {
        id: 'hand', name: '铁拳', damage: 10, icon: '👊', unlockScore: 0,
        rarity: 'common', attackStars: 1, speedStars: 3, critStars: 1,
        description: '最基础的武器，但永远可靠',
        color: '#9E9E9E'  // 普通灰
      },
      {
        id: 'phone', name: '愤怒手机', damage: 15, icon: '📱', unlockScore: 50,
        rarity: 'common', attackStars: 1, speedStars: 3, critStars: 2,
        description: '摔了无数次依然坚挺',
        color: '#2196F3'  // 蓝色
      },
      {
        id: 'keyboard', name: '机械键盘', damage: 20, icon: '⌨️', unlockScore: 100,
        rarity: 'uncommon', attackStars: 2, speedStars: 2, critStars: 2,
        description: '程序员的愤怒之源',
        color: '#4CAF50'  // 绿色
      },
      {
        id: 'chair', name: '人体工学椅', damage: 30, icon: '🪑', unlockScore: 300,
        rarity: 'uncommon', attackStars: 3, speedStars: 1, critStars: 2,
        description: '久坐族的复仇武器',
        color: '#4CAF50'
      },
      {
        id: 'hammer', name: '正义之锤', damage: 50, icon: '🔨', unlockScore: 500,
        rarity: 'rare', attackStars: 4, speedStars: 1, critStars: 3,
        description: '一锤定音，气消云散',
        color: '#9C27B0'  // 紫色
      },
      {
        id: 'baseball', name: '全垒打棒', damage: 100, icon: '⚾', unlockScore: 1000,
        rarity: 'epic', attackStars: 5, speedStars: 2, critStars: 4,
        description: '送你一记本垒打！',
        color: '#FF9800'  // 橙色
      }
    ],
    // 特殊武器（需要成就或分享解锁）- 传说级
    specialWeapons: [
      {
        id: 'bomb', name: '怒火炸弹', damage: 150, icon: '💣',
        unlockType: 'achievement', unlockCondition: '累计伤害5000', unlocked: false,
        rarity: 'legendary', attackStars: 5, speedStars: 1, critStars: 5,
        description: '爆发你所有的怒气！',
        color: '#F44336'  // 红色
      },
      {
        id: 'rocket', name: '出气火箭', damage: 200, icon: '🚀',
        unlockType: 'share', unlockCondition: '分享3次', unlocked: false,
        rarity: 'legendary', attackStars: 5, speedStars: 3, critStars: 4,
        description: '让烦恼飞向太空',
        color: '#F44336'
      },
      {
        id: 'lightning', name: '雷神之怒', damage: 250, icon: '⚡',
        unlockType: 'achievement', unlockCondition: '连击20次', unlocked: false,
        rarity: 'legendary', attackStars: 5, speedStars: 5, critStars: 3,
        description: '以闪电之速释放怒火',
        color: '#F44336'
      },
      {
        id: 'nuke', name: '终极核弹', damage: 500, icon: '☢️',
        unlockType: 'achievement', unlockCondition: '累计伤害10000', unlocked: false,
        rarity: 'mythic', attackStars: 5, speedStars: 1, critStars: 5,
        description: '毁灭一切烦恼的终极武器',
        color: '#FFD700'  // 金色
      }
    ],
    // 武器面板状态
    showWeaponPanel: false,
    currentCardIndex: 0,      // 当前卡片索引（轮播用）

    // 成就系统
    showAchievementPanel: false,  // 荣誉墙面板
    showAchievementUnlock: false, // 成就解锁动画
    newAchievement: null,         // 新解锁的成就
    unlockedAchievementCount: 0,  // 已解锁成就数量
    achievements: [
      { id: 'beginner', name: '初级出气侠', icon: '🥉', requirement: 100, description: '累计伤害100', unlocked: false },
      { id: 'intermediate', name: '中级出气侠', icon: '🥈', requirement: 500, description: '累计伤害500', unlocked: false },
      { id: 'advanced', name: '高级出气侠', icon: '🥇', requirement: 1000, description: '累计伤害1000', unlocked: false },
      { id: 'warrior', name: '暴怒战士', icon: '🏆', requirement: 5000, description: '累计伤害5000', unlocked: false },
      { id: 'king', name: '出气之王', icon: '👑', requirement: 10000, description: '累计伤害10000', unlocked: false },
      { id: 'collector', name: '武器收藏家', icon: '⚔️', requirement: 3, description: '解锁3种武器', type: 'weapon', unlocked: false },
      { id: 'arsenal', name: '军火大亨', icon: '🗡️', requirement: 6, description: '解锁6种武器', type: 'weapon', unlocked: false },
      { id: 'combo10', name: '连击新手', icon: '🔥', requirement: 10, description: '达成10连击', type: 'combo', unlocked: false },
      { id: 'combo20', name: '连击大师', icon: '⚡', requirement: 20, description: '达成20连击', type: 'combo', unlocked: false }
    ],

    // 分享卡片系统
    showShareCard: false,       // 显示分享卡片
    shareCardData: null,        // 分享卡片数据

    // 设置菜单
    showSettingsMenu: false,    // 设置弹出菜单

    // 点击波纹特效
    ripples: [],
    nextRippleId: 0,

    // 表情系统
    bagExpression: 'normal',
    expressionTimer: null,

    // 粒子特效系统
    particles: [],
    nextParticleId: 0,

    // UI模式
    darkMode: false,
    bgmPlaying: false,
    showTapHint: true,  // 点击提示

    // 受击动画
    bagShaking: false,
    btnPressed: false,        // 按钮按下状态
    screenShaking: false,     // 屏幕震动
    comboFlash: false,        // 连击闪光
    showComboResult: false,   // 显示连击结算
    comboResultText: '',      // 连击结算文字
    comboDamageTotal: 0,      // 连击总伤害

    // 伤害飘字
    damageTexts: [],

    // 暴怒模式
    rageMode: false,
    rageModeTimer: null,
    lastClickTime: 0,
    clickCount: 0,

    // 自定义头像
    useCustomFace: false,
    customFaceUrl: '',

    // 长按连击
    longPressTimer: null,
    isLongPressing: false
  },

  audioPool: null,
  bgmAudioContext: null,
  idleTimer: null,
  bag3DRenderer: null,

  /**
   * 页面加载
   */
  onLoad () {
    console.log('首页加载');

    // 获取状态栏高度（用于自定义导航栏）
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20
    });

    // 初始化音频池
    this.audioPool = new AudioPool();

    // 初始化 3D 渲染器
    this.init3DRenderer();

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
   * 预加载表情图片
   */
  preloadExpressionImages () {
    // 已废弃 - 使用 3D 渲染器替代
  },

  /**
   * 初始化 3D 渲染器
   */
  async init3DRenderer () {
    const that = this;

    wx.createSelectorQuery()
      .select('#bag3d-canvas')
      .node()
      .exec((res) => {
        if (res && res[0]) {
          const canvas = res[0].node;

          // 设置画布尺寸
          const dpr = wx.getSystemInfoSync().pixelRatio;
          const width = 300; // rpx 转 px
          const height = 300;
          canvas.width = width * dpr;
          canvas.height = height * dpr;

          // 创建 Three.js 3D 渲染器
          that.bag3DRenderer = new Bag3DRenderer(canvas, that);
          that.bag3DRenderer.init();

          console.log('3D 受气包渲染器初始化成功');
        }
      });
  },

  /**
   * 加载游戏数据
   */
  loadGameData () {
    const totalScore = wx.getStorageSync('totalScore') || 0;
    const currentWeaponId = wx.getStorageSync('currentWeapon') || 'hand';
    const customFaceUrl = wx.getStorageSync('customFaceUrl') || '';

    // 加载今日伤害
    const todayKey = this.getTodayKey();
    const todayScore = wx.getStorageSync(todayKey) || 0;

    const currentWeapon = this.data.weapons.find(w => w.id === currentWeaponId) || this.data.weapons[0];

    this.setData({
      totalScore,
      todayScore,
      currentWeapon,
      useCustomFace: !!customFaceUrl,
      customFaceUrl
    });
  },

  /**
   * 获取今日存储键名
   */
  getTodayKey () {
    const now = new Date();
    return `todayScore_${now.getFullYear()}_${now.getMonth() + 1}_${now.getDate()}`;
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
   * 点击受气包（核心功能）- 完整打击动效序列
   */
  onBagTap (e) {
    console.log('点击受气包', e);

    // 隐藏点击提示
    if (this.data.showTapHint) {
      this.setData({ showTapHint: false });
    }

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
    const newTodayScore = this.data.todayScore + actualDamage;

    // 累计连击伤害
    const newComboDamage = this.data.comboDamageTotal + actualDamage;

    // ===== 打击动效序列 (300ms) =====

    // 阶段1: 点击瞬间 (0-50ms)
    // - 按钮缩小、屏幕震动
    this.setData({
      btnPressed: true,
      screenShaking: true,
      comboDamageTotal: newComboDamage
    });

    // 2. 切换表情
    this.changeBagExpression(isCrit);

    // 3. 显示受击动画（受气包压缩）
    this.showHitAnimation(isCrit);

    // 4. 播放音效
    this.playHitSound();

    // 5. 震动反馈
    this.vibratePhone(isCrit);

    // 6. 显示伤害飘字（从打击点弹出）
    const position = this.getTouchPosition(e);
    this.showDamageText(actualDamage, position, isCrit);

    // 7. 生成粒子特效
    this.createParticles(position, isCrit);

    // 阶段2: 打击反馈 (50ms后)
    setTimeout(() => {
      // 屏幕震动结束
      this.setData({ screenShaking: false });
    }, 50);

    // 阶段3: 恢复阶段 (150ms后)
    setTimeout(() => {
      // 按钮恢复
      this.setData({ btnPressed: false });

      // 更新分数（带滚动效果）
      this.setData({
        totalScore: newScore,
        todayScore: newTodayScore
      });

      wx.setStorageSync('totalScore', newScore);
      wx.setStorageSync(this.getTodayKey(), newTodayScore);
    }, 150);

    // 8. 检查武器解锁
    this.checkWeaponUnlock(newScore);

    // 9. 更新连击（含连击特效）
    this.updateCombo(actualDamage);
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

    // 更新 3D 表情
    if (this.bag3DRenderer) {
      this.bag3DRenderer.changeExpression(expression);
    }

    this.setData({ bagExpression: expression });

    this.expressionTimer = setTimeout(() => {
      if (this.bag3DRenderer) {
        this.bag3DRenderer.changeExpression('normal');
      }
      this.setData({ bagExpression: 'normal' });
    }, duration);
  },

  /**
   * 显示受击动画 - 挤压回弹效果
   */
  showHitAnimation (isCrit = false) {
    // 设置动画状态
    this.setData({ bagShaking: true });

    // 触发 3D 受击动画
    if (this.bag3DRenderer) {
      this.bag3DRenderer.hitAnimation(isCrit);
    }

    // 根据是否暴击调整动画时长
    const duration = isCrit ? 500 : 300;

    setTimeout(() => {
      this.setData({ bagShaking: false });
    }, duration);
  },

  /**
   * 播放受击音效
   */
  playHitSound () {
    const weaponId = this.data.currentWeapon.id;
    const soundMap = {
      'hand': '/audio/slap.mp3',
      'keyboard': '/audio/slap.mp3',
      'hammer': '/audio/slap.mp3',
      'baseball': '/audio/slap.mp3'
    };

    const soundPath = soundMap[weaponId] || '/audio/slap.mp3';

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
   * 更新连击 - 含连击特效
   */
  updateCombo (damage = 0) {
    if (this.comboTimer) {
      clearTimeout(this.comboTimer);
    }

    const newCombo = this.data.comboCount + 1;

    // 连击超过3次触发特效
    if (newCombo > 2) {
      // 屏幕震动加强
      this.setData({
        comboCount: newCombo,
        screenShaking: true,
        comboFlash: true
      });

      // 背景闪烁红光效果
      setTimeout(() => {
        this.setData({ comboFlash: false, screenShaking: false });
      }, 100);

      // 增强震动
      wx.vibrateShort({ type: 'heavy' });
    } else {
      this.setData({ comboCount: newCombo });
    }

    // 记录最大连击数（用于解锁闪电武器）
    const maxCombo = wx.getStorageSync('maxCombo') || 0;
    if (newCombo > maxCombo) {
      wx.setStorageSync('maxCombo', newCombo);

      // 检查是否解锁闪电武器
      if (newCombo === 20) {
        setTimeout(() => {
          wx.showToast({
            title: '⚡ 闪电已解锁！',
            icon: 'none',
            duration: 2000
          });
        }, 500);
      }
    }

    // 连击结束时显示结算（1秒无操作）
    this.comboTimer = setTimeout(() => {
      const finalCombo = this.data.comboCount;
      const totalDamage = this.data.comboDamageTotal;

      // 连击超过3次显示结算提示
      if (finalCombo > 2) {
        this.setData({
          showComboResult: true,
          comboResultText: `连击x${finalCombo}！总伤害+${totalDamage}`
        });

        // 1.5秒后隐藏结算
        setTimeout(() => {
          this.setData({ showComboResult: false });
        }, 1500);
      }

      // 重置连击
      this.setData({
        comboCount: 0,
        comboDamageTotal: 0
      });
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
   * 打开武器选择面板
   */
  openWeaponPanel () {
    // 更新特殊武器解锁状态
    this.updateSpecialWeaponsStatus();
    this.setData({ showWeaponPanel: true });
  },

  /**
   * 关闭武器选择面板
   */
  closeWeaponPanel () {
    this.setData({ showWeaponPanel: false });
  },

  /**
   * 更新特殊武器解锁状态
   */
  updateSpecialWeaponsStatus () {
    const totalScore = this.data.totalScore;
    const shareCount = wx.getStorageSync('shareCount') || 0;
    const maxCombo = wx.getStorageSync('maxCombo') || 0;

    const specialWeapons = this.data.specialWeapons.map(weapon => {
      let unlocked = false;
      if (weapon.id === 'bomb' && totalScore >= 5000) unlocked = true;
      if (weapon.id === 'rocket' && shareCount >= 3) unlocked = true;
      if (weapon.id === 'lightning' && maxCombo >= 20) unlocked = true;
      if (weapon.id === 'nuke' && totalScore >= 10000) unlocked = true;
      return { ...weapon, unlocked };
    });

    this.setData({ specialWeapons });
  },

  /**
   * 切换武器
   */
  switchWeapon (e) {
    const weaponId = e.currentTarget.dataset.id;
    const isSpecial = e.currentTarget.dataset.special === 'true';

    let weapon;
    if (isSpecial) {
      weapon = this.data.specialWeapons.find(w => w.id === weaponId);
      if (!weapon) return;

      // 检查特殊武器是否解锁
      if (!weapon.unlocked) {
        wx.showToast({
          title: `解锁条件：${weapon.unlockCondition}`,
          icon: 'none'
        });
        return;
      }
    } else {
      weapon = this.data.weapons.find(w => w.id === weaponId);
      if (!weapon) return;

      // 检查普通武器是否解锁
      if (weapon.unlockScore > this.data.totalScore) {
        wx.showToast({
          title: `需要 ${weapon.unlockScore} 分解锁`,
          icon: 'none'
        });
        return;
      }
    }

    this.setData({
      currentWeapon: weapon,
      showWeaponPanel: false
    });

    wx.setStorageSync('currentWeapon', weaponId);

    wx.showToast({
      title: `切换至 ${weapon.name}`,
      icon: 'success'
    });
  },

  /**
   * 打开设置菜单
   */
  openSettingsMenu () {
    this.setData({ showSettingsMenu: true });
  },

  /**
   * 关闭设置菜单
   */
  closeSettingsMenu () {
    this.setData({ showSettingsMenu: false });
  },

  /**
   * 显示关于信息
   */
  showAbout () {
    this.closeSettingsMenu();
    wx.showModal({
      title: '😤 受气包',
      content: '一款解压出气小游戏\n\n版本: 1.0.0\n作者: 受气包团队\n\n生气了？来打我呀！',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  /**
   * 切换暗黑模式
   */
  toggleDarkMode () {
    this.closeSettingsMenu();
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
    this.closeSettingsMenu();
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
            todayScore: 0,
            currentWeapon: this.data.weapons[0]
          });
          wx.setStorageSync('totalScore', 0);
          wx.setStorageSync(this.getTodayKey(), 0);
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
   * 查看成就 - 打开荣誉墙
   */
  viewAchievements () {
    // 更新成就解锁状态
    this.updateAchievementsStatus();
    this.setData({ showAchievementPanel: true });
  },

  /**
   * 关闭成就面板
   */
  closeAchievementPanel () {
    this.setData({ showAchievementPanel: false });
  },

  /**
   * 更新成就解锁状态
   */
  updateAchievementsStatus () {
    const totalScore = this.data.totalScore;
    const maxCombo = wx.getStorageSync('maxCombo') || 0;
    const unlockedWeapons = this.data.weapons.filter(w => w.unlockScore <= totalScore).length;

    const achievements = this.data.achievements.map(achievement => {
      let unlocked = false;
      if (achievement.type === 'weapon') {
        unlocked = unlockedWeapons >= achievement.requirement;
      } else if (achievement.type === 'combo') {
        unlocked = maxCombo >= achievement.requirement;
      } else {
        unlocked = totalScore >= achievement.requirement;
      }
      return { ...achievement, unlocked };
    });

    // 计算已解锁成就数量
    const unlockedAchievementCount = achievements.filter(a => a.unlocked).length;

    this.setData({ achievements, unlockedAchievementCount });
  },

  /**
   * 检查并触发成就解锁动画
   */
  checkAchievementUnlock (newScore, newCombo = 0) {
    const maxCombo = Math.max(wx.getStorageSync('maxCombo') || 0, newCombo);
    const unlockedWeapons = this.data.weapons.filter(w => w.unlockScore <= newScore).length;

    for (const achievement of this.data.achievements) {
      if (achievement.unlocked) continue;

      let shouldUnlock = false;
      if (achievement.type === 'weapon') {
        shouldUnlock = unlockedWeapons >= achievement.requirement;
      } else if (achievement.type === 'combo') {
        shouldUnlock = maxCombo >= achievement.requirement;
      } else {
        shouldUnlock = newScore >= achievement.requirement;
      }

      if (shouldUnlock) {
        // 触发解锁动画
        this.showAchievementUnlockAnimation(achievement);
        return; // 一次只显示一个
      }
    }
  },

  /**
   * 显示成就解锁动画
   */
  showAchievementUnlockAnimation (achievement) {
    this.setData({
      showAchievementUnlock: true,
      newAchievement: achievement
    });

    // 播放音效
    // this.playSound('achievement');

    // 震动
    wx.vibrateLong();

    // 3秒后关闭
    setTimeout(() => {
      this.setData({ showAchievementUnlock: false });
      // 更新成就状态
      this.updateAchievementsStatus();
    }, 3000);
  },

  /**
   * 分享战绩 - 生成社交卡片
   */
  shareResult () {
    const totalScore = this.data.totalScore;
    const todayScore = this.data.todayScore;
    const maxCombo = wx.getStorageSync('maxCombo') || 0;
    const weaponName = this.data.currentWeapon.name;

    // 根据伤害量生成趣味标签
    let funnyTag = '今日情绪稳定 😌';
    let moodEmoji = '😐';
    if (todayScore >= 10000) {
      funnyTag = '暴力美学大师 💥';
      moodEmoji = '😈';
    } else if (todayScore >= 5000) {
      funnyTag = '键盘毁灭者 ⌨️';
      moodEmoji = '😤';
    } else if (todayScore >= 1000) {
      funnyTag = '怒气释放中 🔥';
      moodEmoji = '😠';
    } else if (todayScore >= 500) {
      funnyTag = '小有成就 💪';
      moodEmoji = '😊';
    }

    // 根据伤害选择受气包表情
    let bagMood = 'normal';
    if (totalScore >= 10000) bagMood = 'dizzy';
    else if (totalScore >= 5000) bagMood = 'crit';
    else if (totalScore >= 1000) bagMood = 'hit';

    this.setData({
      showShareCard: true,
      shareCardData: {
        totalScore,
        todayScore,
        maxCombo,
        weaponName,
        funnyTag,
        moodEmoji,
        bagMood,
        date: this.formatDate(new Date())
      }
    });
  },

  /**
   * 格式化日期
   */
  formatDate (date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  },

  /**
   * 关闭分享卡片
   */
  closeShareCard () {
    this.setData({ showShareCard: false });
  },

  /**
   * 分享给好友
   */
  shareToFriend () {
    // 触发微信分享
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });

    wx.showToast({
      title: '点击右上角分享',
      icon: 'none'
    });
  },

  /**
   * 保存分享卡片
   */
  saveShareCard () {
    // 记录分享次数
    const shareCount = (wx.getStorageSync('shareCount') || 0) + 1;
    wx.setStorageSync('shareCount', shareCount);

    wx.showToast({
      title: '卡片已保存',
      icon: 'success'
    });

    // 检查是否解锁新武器
    if (shareCount === 3) {
      setTimeout(() => {
        this.showAchievementUnlockAnimation({
          id: 'rocket_unlock',
          name: '火箭已解锁',
          icon: '🚀',
          description: '分享3次解锁'
        });
      }, 1500);
    }

    this.setData({ showShareCard: false });
  },

  /**
   * 创建点击波纹
   */
  createRipple (x, y) {
    const ripple = {
      id: this.data.nextRippleId,
      x: x,
      y: y
    };

    const ripples = [...this.data.ripples, ripple];
    this.setData({
      ripples,
      nextRippleId: this.data.nextRippleId + 1
    });

    // 动画结束后移除
    setTimeout(() => {
      const newRipples = this.data.ripples.filter(r => r.id !== ripple.id);
      this.setData({ ripples: newRipples });
    }, 600);
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
    // 清理 3D 渲染器
    if (this.bag3DRenderer) {
      this.bag3DRenderer.dispose();
      this.bag3DRenderer = null;
    }

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
