/**
 * 音效管理器 - 使用音频池解决高频点击时音效截断问题
 */
class AudioManager {
  constructor() {
    this.audioPool = []; // 音频实例池
    this.poolSize = 8; // 池大小
    this.currentIndex = 0;
    this.isMuted = false;
  }

  /**
   * 初始化音频池
   * @param {String} audioSrc - 音频文件路径
   */
  initPool (audioSrc) {
    this.audioPool = [];

    for (let i = 0; i < this.poolSize; i++) {
      const audio = uni.createInnerAudioContext();
      audio.src = audioSrc;
      audio.volume = 0.8;
      this.audioPool.push(audio);
    }
  }

  /**
   * 播放音效
   */
  play () {
    if (this.isMuted || this.audioPool.length === 0) return;

    // 轮流使用池中的音频实例
    const audio = this.audioPool[this.currentIndex];
    audio.stop(); // 停止当前播放
    audio.play(); // 重新播放

    this.currentIndex = (this.currentIndex + 1) % this.poolSize;
  }

  /**
   * 切换静音
   */
  toggleMute (muted) {
    this.isMuted = muted;
  }

  /**
   * 销毁音频池
   */
  destroy () {
    this.audioPool.forEach(audio => {
      audio.destroy();
    });
    this.audioPool = [];
  }
}

export default AudioManager;
