/**
 * 粒子对象池 - 复用粒子对象而非创建/销毁
 * 解决高频点击时的 GC 压力
 */
class ParticlePool {
  constructor(initialSize = 100) {
    this.available = [];
    this.active = new Map(); // id -> particle
    this.nextId = 0;

    // 预生成粒子对象
    for (let i = 0; i < initialSize; i++) {
      this.available.push(this.createParticleTemplate());
    }
  }

  createParticleTemplate () {
    return {
      id: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 0,
      color: '#FFD700',
      rotation: 0,
      age: 0,
      lifetime: 600,
      active: false
    };
  }

  /**
   * 获取粒子实例
   */
  acquire (x, y, vx, vy, size, color, rotation = 0) {
    let particle;

    if (this.available.length > 0) {
      particle = this.available.pop();
    } else {
      particle = this.createParticleTemplate();
    }

    const id = this.nextId++;
    particle.id = id;
    particle.x = x;
    particle.y = y;
    particle.vx = vx;
    particle.vy = vy;
    particle.size = size;
    particle.color = color;
    particle.rotation = rotation;
    particle.age = 0;
    particle.active = true;

    this.active.set(id, particle);
    return particle;
  }

  /**
   * 释放粒子回池
   */
  release (particleId) {
    const particle = this.active.get(particleId);
    if (particle) {
      particle.active = false;
      this.active.delete(particleId);
      this.available.push(particle);
    }
  }

  /**
   * 释放多个粒子
   */
  releaseMany (ids) {
    ids.forEach(id => this.release(id));
  }

  /**
   * 获取活跃粒子列表
   */
  getActive () {
    return Array.from(this.active.values());
  }

  /**
   * 清空所有粒子
   */
  clear () {
    this.active.forEach((particle) => {
      particle.active = false;
      this.available.push(particle);
    });
    this.active.clear();
  }

  /**
   * 获取池大小信息
   */
  getStats () {
    return {
      active: this.active.size,
      available: this.available.length,
      total: this.active.size + this.available.length
    };
  }
}

module.exports = ParticlePool;
