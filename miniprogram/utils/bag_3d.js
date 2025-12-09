/**
 * 受气包渲染器 - 使用原生 Canvas 2D
 * 无需任何第三方库，纯原生实现
 */

class Bag3DRenderer {
  constructor(canvas, component) {
    this.canvas = canvas;
    this.component = component;
    this.ctx = null;
    this.animationFrameId = null;
    this.currentExpression = 'normal';

    // 动画参数
    this.squashAmount = 0;
    this.squashTarget = 0;
    this.squashSpeed = 0.15;
    this.rotationAngle = 0;
    this.targetRotationAngle = 0;

    // 眼睛动画
    this.eyeScale = { x: 1, y: 1 };
    this.eyeRotation = 0;

    // 嘴巴参数
    this.mouthCurve = 0; // -1(悲伤) 到 1(开心)

    // 渲染尺寸
    this.width = 0;
    this.height = 0;
    this.centerX = 0;
    this.centerY = 0;
  }

  /**
   * 初始化渲染器
   */
  async init () {
    if (!this.canvas) {
      console.error('Canvas is not available');
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;

    console.log('Canvas 2D 受气包渲染器初始化成功', this.width, this.height);

    // 开始渲染循环
    this.animate();
  }

  /**
   * 切换表情
   * @param {string} expression - normal, hit, crit, dizzy
   */
  changeExpression (expression) {
    this.currentExpression = expression;

    switch (expression) {
      case 'normal':
        this.setNormalExpression();
        break;
      case 'hit':
        this.setHitExpression();
        break;
      case 'crit':
        this.setCritExpression();
        break;
      case 'dizzy':
        this.setDizzyExpression();
        break;
    }
  }

  /**
   * 正常表情
   */
  setNormalExpression () {
    this.eyeScale = { x: 1, y: 1 };
    this.eyeRotation = 0;
    this.mouthCurve = 0.3; // 微笑
  }

  /**
   * 受击表情
   */
  setHitExpression () {
    this.eyeScale = { x: 1.5, y: 0.2 }; // 紧闭的眼睛
    this.eyeRotation = 0;
    this.mouthCurve = -0.5; // "O"型嘴
  }

  /**
   * 暴击表情
   */
  setCritExpression () {
    this.eyeScale = { x: 1.2, y: 0.1 }; // X形眼睛
    this.eyeRotation = Math.PI / 4;
    this.mouthCurve = -0.8; // 大张的嘴
  }

  /**
   * 晕眩表情
   */
  setDizzyExpression () {
    this.eyeScale = { x: 1, y: 1 };
    this.eyeRotation = Math.PI / 6; // 螺旋眼
    this.mouthCurve = -0.3; // 歪嘴
  }

  /**
   * 受击动画 - 压扁效果
   */
  hitAnimation (isCrit = false) {
    this.squashTarget = isCrit ? 0.5 : 0.3;

    // 随机旋转方向
    const randomRotation = (Math.random() - 0.5) * 0.3;
    this.targetRotationAngle = randomRotation;
  }

  /**
   * 绘制受气包
   */
  draw () {
    if (!this.ctx) return;

    // 清空画布
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 保存状态
    this.ctx.save();

    // 移动到中心
    this.ctx.translate(this.centerX, this.centerY);

    // 应用旋转
    this.ctx.rotate(this.rotationAngle);

    // 应用压扁变形
    const scaleY = 1 - this.squashAmount;
    const scaleX = 1 + this.squashAmount * 0.5;
    this.ctx.scale(scaleX, scaleY);

    // 绘制主体（圆形）
    const radius = Math.min(this.width, this.height) * 0.35;
    this.drawBagBody(radius);

    // 绘制眼睛
    this.drawEyes(radius);

    // 绘制嘴巴
    this.drawMouth(radius);

    // 恢复状态
    this.ctx.restore();

    // 绘制阴影
    this.drawShadow(radius * scaleX, this.squashAmount);
  }

  /**
   * 绘制受气包主体
   */
  drawBagBody (radius) {
    const ctx = this.ctx;

    // 主体圆形
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#D4A574'; // 沙袋棕色
    ctx.fill();

    // 添加阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    ctx.fill();

    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 描边
    ctx.strokeStyle = '#A67C52';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 高光
    const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, -radius * 0.3, -radius * 0.3, radius * 0.6);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  /**
   * 绘制眼睛
   */
  drawEyes (radius) {
    const ctx = this.ctx;
    const eyeY = -radius * 0.15;
    const eyeSpacing = radius * 0.25;
    const eyeRadius = radius * 0.12;

    ctx.save();

    // 左眼
    ctx.save();
    ctx.translate(-eyeSpacing, eyeY);
    ctx.rotate(this.eyeRotation);
    ctx.scale(this.eyeScale.x, this.eyeScale.y);

    ctx.beginPath();
    ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();

    // 眼神光
    if (this.eyeScale.y > 0.5) {
      ctx.beginPath();
      ctx.arc(eyeRadius * 0.3, -eyeRadius * 0.3, eyeRadius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }

    ctx.restore();

    // 右眼
    ctx.save();
    ctx.translate(eyeSpacing, eyeY);
    ctx.rotate(this.eyeRotation);
    ctx.scale(this.eyeScale.x, this.eyeScale.y);

    ctx.beginPath();
    ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();

    // 眼神光
    if (this.eyeScale.y > 0.5) {
      ctx.beginPath();
      ctx.arc(eyeRadius * 0.3, -eyeRadius * 0.3, eyeRadius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }

    ctx.restore();

    ctx.restore();
  }

  /**
   * 绘制嘴巴
   */
  drawMouth (radius) {
    const ctx = this.ctx;
    const mouthY = radius * 0.15;
    const mouthWidth = radius * 0.3;

    ctx.beginPath();
    ctx.moveTo(-mouthWidth, mouthY);

    // 根据表情绘制不同曲线
    if (this.mouthCurve > 0) {
      // 微笑
      ctx.quadraticCurveTo(0, mouthY + mouthWidth * this.mouthCurve, mouthWidth, mouthY);
    } else {
      // 悲伤/惊讶
      ctx.quadraticCurveTo(0, mouthY - mouthWidth * Math.abs(this.mouthCurve), mouthWidth, mouthY);
    }

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  /**
   * 绘制阴影
   */
  drawShadow (width, squash) {
    const ctx = this.ctx;
    const shadowY = this.centerY + Math.min(this.width, this.height) * 0.45;
    const shadowWidth = width * (1 + squash);
    const shadowHeight = 20;

    ctx.save();
    ctx.translate(this.centerX, shadowY);

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, shadowWidth);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, shadowWidth, shadowHeight, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * 渲染循环
   */
  animate () {
    if (!this.ctx) return;

    // 平滑压扁动画
    if (Math.abs(this.squashAmount - this.squashTarget) > 0.01) {
      this.squashAmount += (this.squashTarget - this.squashAmount) * this.squashSpeed;
    } else if (this.squashTarget !== 0) {
      this.squashTarget = 0; // 回弹
    }

    // 平滑旋转
    if (Math.abs(this.rotationAngle - this.targetRotationAngle) > 0.01) {
      this.rotationAngle += (this.targetRotationAngle - this.rotationAngle) * 0.1;
    } else if (this.targetRotationAngle !== 0) {
      this.targetRotationAngle = 0;
    }

    // 绘制
    this.draw();

    // 继续动画循环
    this.animationFrameId = this.canvas.requestAnimationFrame(() => {
      this.animate();
    });
  }

  /**
   * 调整画布大小
   */
  resize (width, height) {
    this.width = width;
    this.height = height;
    this.centerX = width / 2;
    this.centerY = height / 2;
  }

  /**
   * 销毁资源
   */
  dispose () {
    if (this.animationFrameId) {
      this.canvas.cancelAnimationFrame(this.animationFrameId);
    }
    this.ctx = null;
  }
}

module.exports = Bag3DRenderer;
