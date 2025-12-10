/**
 * 受气包渲染器 - 使用 Three.js
 */

const { createScopedThreejs } = require('threejs-miniprogram');

class Bag3DRenderer {
  constructor(canvas, component) {
    this.canvas = canvas;
    this.component = component;
    this.THREE = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationFrameId = null;
    this.currentExpression = 'normal';

    // 3D 对象
    this.bagMesh = null;
    this.eyeLeft = null;
    this.eyeRight = null;
    this.eyeHighlightLeft = null;
    this.eyeHighlightRight = null;
    this.mouthGroup = null;

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
  }

  /**
   * 初始化渲染器
   */
  async init () {
    if (!this.canvas) {
      console.error('Canvas is not available');
      return;
    }

    // 创建 Three.js 实例
    this.THREE = createScopedThreejs(this.canvas);
    const THREE = this.THREE;

    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = null; // 透明背景

    // 创建相机
    const aspect = this.width / this.height;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 0, 5);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(this.canvas.width / 300); // 根据实际尺寸调整

    // 创建受气包
    this.createBag();

    // 添加灯光
    this.setupLights();

    // 设置初始表情
    this.setNormalExpression();

    console.log('Three.js 受气包渲染器初始化成功', this.width, this.height);

    // 开始渲染循环
    this.animate();
  }

  /**
   * 设置灯光
   */
  setupLights () {
    const THREE = this.THREE;

    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // 主光源
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(2, 3, 5);
    this.scene.add(directionalLight);

    // 补光
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-2, -1, 3);
    this.scene.add(fillLight);
  }

  /**
   * 创建受气包 3D 模型
   */
  createBag () {
    const THREE = this.THREE;

    // 创建受气包主体（球体）
    const radius = 1;
    const segments = 32;
    const geometry = new THREE.SphereGeometry(radius, segments, segments);

    // 材质
    const material = new THREE.MeshStandardMaterial({
      color: 0xD4A574, // 沙袋棕色
      roughness: 0.7,
      metalness: 0.1
    });

    this.bagMesh = new THREE.Mesh(geometry, material);
    this.bagMesh.castShadow = true;
    this.bagMesh.receiveShadow = true;
    this.scene.add(this.bagMesh);

    // 创建眼睛
    this.createEyes();

    // 创建嘴巴
    this.createMouth();
  }

  /**
   * 创建眼睛
   */
  createEyes () {
    const THREE = this.THREE;

    // 左眼
    const eyeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.eyeLeft = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.eyeLeft.position.set(-0.35, 0.2, 0.85);
    this.scene.add(this.eyeLeft);

    // 左眼神光（作为左眼的子对象）
    const highlightGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.eyeHighlightLeft = new THREE.Mesh(highlightGeometry, highlightMaterial);
    this.eyeHighlightLeft.position.set(-0.03, 0.02, 0.05); // 相对于眼睛的位置
    this.eyeLeft.add(this.eyeHighlightLeft);

    // 右眼
    this.eyeRight = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.eyeRight.position.set(0.35, 0.2, 0.85);
    this.scene.add(this.eyeRight);

    // 右眼神光（作为右眼的子对象）
    this.eyeHighlightRight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    this.eyeHighlightRight.position.set(-0.03, 0.02, 0.05); // 相对于眼睛的位置
    this.eyeRight.add(this.eyeHighlightRight);
  }

  /**
   * 创建嘴巴
   */
  createMouth () {
    const THREE = this.THREE;

    // 使用曲线创建嘴巴
    this.mouthGroup = new THREE.Group();

    // 创建嘴巴曲线
    const points = [];
    const mouthWidth = 0.4;
    const mouthY = -0.2;

    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const x = (t - 0.5) * mouthWidth * 2;
      const y = mouthY + Math.sin(t * Math.PI) * 0.1 * this.mouthCurve;
      points.push(new THREE.Vector3(x, y, 0.85));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.03, 8, false);
    const tubeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const mouthTube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    this.mouthGroup.add(mouthTube);

    this.scene.add(this.mouthGroup);
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
    this.updateMouth();
  }

  /**
   * 受击表情
   */
  setHitExpression () {
    this.eyeScale = { x: 1.5, y: 0.2 }; // 紧闭的眼睛
    this.eyeRotation = 0;
    this.mouthCurve = -0.5; // "O"型嘴
    this.updateMouth();
  }

  /**
   * 暴击表情
   */
  setCritExpression () {
    this.eyeScale = { x: 1.2, y: 0.1 }; // X形眼睛
    this.eyeRotation = Math.PI / 4;
    this.mouthCurve = -0.8; // 大张的嘴
    this.updateMouth();
  }

  /**
   * 晕眩表情
   */
  setDizzyExpression () {
    this.eyeScale = { x: 1, y: 1 };
    this.eyeRotation = Math.PI / 6; // 螺旋眼
    this.mouthCurve = -0.3; // 歪嘴
    this.updateMouth();
  }

  /**
   * 更新嘴巴形状
   */
  updateMouth () {
    if (!this.mouthGroup || !this.THREE) return;

    const THREE = this.THREE;

    // 移除旧的嘴巴
    this.scene.remove(this.mouthGroup);
    this.mouthGroup = new THREE.Group();

    // 创建新的嘴巴曲线
    const points = [];
    const mouthWidth = 0.4;
    const mouthY = -0.2;

    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const x = (t - 0.5) * mouthWidth * 2;
      let y = mouthY;
      if (this.mouthCurve > 0) {
        // 微笑
        y = mouthY + Math.sin(t * Math.PI) * 0.1 * this.mouthCurve;
      } else {
        // 悲伤/惊讶
        y = mouthY - Math.sin(t * Math.PI) * 0.1 * Math.abs(this.mouthCurve);
      }
      points.push(new THREE.Vector3(x, y, 0.85));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.03, 8, false);
    const tubeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const mouthTube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    this.mouthGroup.add(mouthTube);

    this.scene.add(this.mouthGroup);
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
   * 更新 3D 对象状态
   */
  updateObjects () {
    if (!this.bagMesh || !this.eyeLeft || !this.eyeRight) return;

    // 更新受气包压扁变形
    const scaleY = 1 - this.squashAmount;
    const scaleX = 1 + this.squashAmount * 0.5;
    const scaleZ = 1 + this.squashAmount * 0.3;
    this.bagMesh.scale.set(scaleX, scaleY, scaleZ);

    // 更新旋转
    this.bagMesh.rotation.z = this.rotationAngle;

    // 更新眼睛
    this.eyeLeft.scale.set(this.eyeScale.x, this.eyeScale.y, 1);
    this.eyeRight.scale.set(this.eyeScale.x, this.eyeScale.y, 1);
    this.eyeLeft.rotation.z = this.eyeRotation;
    this.eyeRight.rotation.z = this.eyeRotation;

    // 根据眼睛缩放显示/隐藏眼神光
    if (this.eyeHighlightLeft) {
      this.eyeHighlightLeft.visible = this.eyeScale.y > 0.5;
    }
    if (this.eyeHighlightRight) {
      this.eyeHighlightRight.visible = this.eyeScale.y > 0.5;
    }
  }

  /**
   * 渲染循环
   */
  animate () {
    if (!this.renderer || !this.scene || !this.camera) return;

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

    // 更新 3D 对象
    this.updateObjects();

    // 渲染场景
    this.renderer.render(this.scene, this.camera);

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

    if (this.camera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }

    if (this.renderer) {
      this.renderer.setSize(width, height);
    }
  }

  /**
   * 销毁资源
   */
  dispose () {
    if (this.animationFrameId) {
      this.canvas.cancelAnimationFrame(this.animationFrameId);
    }

    // 清理 Three.js 资源
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }

    if (this.renderer) {
      this.renderer.dispose();
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.THREE = null;
  }
}

module.exports = Bag3DRenderer;
