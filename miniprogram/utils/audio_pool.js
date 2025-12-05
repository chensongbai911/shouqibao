/**
 * 音频池管理类（改进版 - 支持多音频）
 */
class AudioPool {
  constructor() {
    this.pools = {}; // 存储不同音频的池
    this.poolSize = 3; // 每个音频的实例数量
  }

  /**
   * 播放音效
   */
  play (audioSrc) {
    // 如果该音频还没有池，创建一个
    if (!this.pools[audioSrc]) {
      this.pools[audioSrc] = {
        instances: [],
        currentIndex: 0
      };

      // 创建音频实例池
      for (let i = 0; i < this.poolSize; i++) {
        const audio = wx.createInnerAudioContext();
        audio.src = audioSrc;
        audio.volume = 1.0;
        audio.onError((err) => {
          console.error('音频播放错误:', audioSrc, err);
        });
        this.pools[audioSrc].instances.push(audio);
      }
    }

    const pool = this.pools[audioSrc];
    const audio = pool.instances[pool.currentIndex];

    // 停止并重置当前音频
    audio.stop();
    audio.seek(0);
    audio.play();

    // 更新索引
    pool.currentIndex = (pool.currentIndex + 1) % this.poolSize;
  }

  /**
   * 销毁所有音频实例
   */
  destroy () {
    Object.values(this.pools).forEach(pool => {
      pool.instances.forEach(audio => {
        audio.stop();
        audio.destroy();
      });
    });
    this.pools = {};
  }
}

module.exports = AudioPool;
