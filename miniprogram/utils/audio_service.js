/**
 * 音频服务
 * 管理所有音效和背景音乐
 */
class AudioService {
  constructor() {
    this.audioPool = null;
    this.bgmContext = null;
    this.soundMap = {
      'hit': '/audio/slap.mp3',
      'crit': '/audio/crit.mp3',
      'levelup': '/audio/levelup.mp3',
      'combo': '/audio/combo.mp3',
      'taunt1': '/audio/taunt1.mp3',
      'taunt2': '/audio/taunt2.mp3',
      'taunt3': '/audio/taunt3.mp3'
    };
  }

  /**
   * 初始化音频服务
   */
  initialize (audioPool) {
    this.audioPool = audioPool;
  }

  /**
   * 初始化背景音乐
   */
  initBGM (volume = 0.3, shouldPlay = false) {
    this.bgmContext = wx.createInnerAudioContext();
    this.bgmContext.src = '/audio/bgm.mp3';
    this.bgmContext.loop = true;
    this.bgmContext.volume = volume;

    this.bgmContext.onError((err) => {
      console.warn('BGM播放失败:', err);
    });

    if (shouldPlay) {
      this.bgmContext.play();
    }

    return this.bgmContext;
  }

  /**
   * 播放音效
   */
  playSound (soundKey, customPath = null) {
    if (!this.audioPool) return;

    const soundPath = customPath || this.soundMap[soundKey];
    if (!soundPath) {
      console.warn('未找到音效:', soundKey);
      return;
    }

    this.audioPool.play(soundPath);
  }

  /**
   * 播放打击音效
   */
  playHitSound (weaponId = 'hand') {
    this.playSound('hit');
  }

  /**
   * 播放暴击音效
   */
  playCritSound () {
    this.playSound('crit');
  }

  /**
   * 播放升级音效
   */
  playLevelUpSound () {
    this.playSound('levelup');
  }

  /**
   * 播放连击音效
   */
  playComboSound () {
    this.playSound('combo');
  }

  /**
   * 播放嘲讽音效
   */
  playTauntSound (tauntIndex = 1) {
    const soundKey = `taunt${Math.min(Math.max(tauntIndex, 1), 3)}`;
    this.playSound(soundKey);
  }

  /**
   * 切换 BGM 播放
   */
  toggleBGM () {
    if (!this.bgmContext) return false;

    if (this.bgmContext.paused) {
      this.bgmContext.play();
      return true;
    } else {
      this.bgmContext.pause();
      return false;
    }
  }

  /**
   * 设置 BGM 音量
   */
  setBGMVolume (volume) {
    if (this.bgmContext) {
      this.bgmContext.volume = Math.max(0, Math.min(volume, 1));
    }
  }

  /**
   * 停止 BGM
   */
  stopBGM () {
    if (this.bgmContext) {
      this.bgmContext.stop();
      this.bgmContext.destroy();
      this.bgmContext = null;
    }
  }

  /**
   * 销毁音频服务
   */
  destroy () {
    this.stopBGM();
    if (this.audioPool) {
      this.audioPool = null;
    }
  }
}

module.exports = AudioService;
