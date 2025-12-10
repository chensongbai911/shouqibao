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
    this.body = null;
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
    this.camera.position.set(0, 0, 9.5);
    this.camera.lookAt(0, 0, 0);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(this.canvas.width / 300); // 根据实际尺寸调整
    // 提升光照质量（在小程序里部分特性可能被忽略，但保持兼容判断）
    if (typeof this.renderer.physicallyCorrectLights !== 'undefined') {
      this.renderer.physicallyCorrectLights = true;
    }
    if (typeof this.renderer.toneMapping !== 'undefined' && this.THREE) {
      this.renderer.toneMapping = this.THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.1; // 与 index.html 保持一致
    }

    // 创建受气包
    this.createBag();
    this.recenterBag();
    this.frameBag();

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

    // 主光（来自右上前方）
    const keyLight = new THREE.SpotLight(0xffffff, 3);
    keyLight.position.set(5, 8, 8);
    keyLight.angle = Math.PI / 4;
    keyLight.penumbra = 0.45;
    keyLight.castShadow = true;
    keyLight.shadow.bias = -0.0001;
    this.scene.add(keyLight);

    // 环境补光（柔和粉色）
    const ambientLight = new THREE.AmbientLight(0xffd1dc, 0.55);
    this.scene.add(ambientLight);

    // 轮廓光（左侧冷光勾边）
    const rimLight = new THREE.DirectionalLight(0xbadfff, 1.4);
    rimLight.position.set(-6, 3, -2);
    this.scene.add(rimLight);

    // 底部反光
    const bottomLight = new THREE.PointLight(0x6e5ce6, 1.2, 30);
    bottomLight.position.set(0, -5, 2);
    this.scene.add(bottomLight);
  }

  /**
   * 创建受气包 3D 模型
   */
  createBag () {
    const THREE = this.THREE;

    const clayNoiseMap = this.createClayNoiseTexture();

    // 材质
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0xffa8b8,
      roughness: 0.5,
      metalness: 0.0,
      bumpMap: clayNoiseMap,
      bumpScale: 0.015,
      clearcoat: 0.35,
      clearcoatRoughness: 0.35
    });

    const spotMat = new THREE.MeshPhysicalMaterial({
      color: 0xffbdd0,
      roughness: 0.35,
      metalness: 0.0,
      bumpMap: clayNoiseMap,
      bumpScale: 0.006,
      clearcoat: 0.65,
      clearcoatRoughness: 0.15
    });

    const featureMat = new THREE.MeshPhysicalMaterial({
      color: 0x2a1d25,
      roughness: 0.35,
      clearcoat: 0.4
    });

    const cheekMat = new THREE.MeshStandardMaterial({
      color: 0xff8da1,
      transparent: true,
      opacity: 0.7
    });

    // 角色组
    const bagGroup = new THREE.Group();
    this.bagMesh = bagGroup;
    this.bagMesh.position.set(0, 0, 0); // 明确居中
    this.scene.add(bagGroup);

    // 主体
    const bodyGeo = new THREE.SphereGeometry(2, 96, 96);
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    bagGroup.add(this.body);

    // 斑点
    const spotPositions = [
      { x: 0, y: 1.6, z: 1.1, s: 0.65 },
      { x: -1.3, y: 1.2, z: 0.8, s: 0.45 },
      { x: 1.4, y: 1.0, z: 0.9, s: 0.48 },
      { x: 0, y: -1.6, z: 1.0, s: 0.58 },
      { x: -1.5, y: -1.0, z: 0.5, s: 0.42 },
      { x: 1.5, y: -1.2, z: 0.5, s: 0.42 },
      { x: -0.8, y: 1.7, z: -0.5, s: 0.42 },
      { x: 0.8, y: 1.7, z: -0.5, s: 0.42 }
    ];

    spotPositions.forEach(pos => {
      const spotGeo = new THREE.SphereGeometry(pos.s, 32, 32);
      const spot = new THREE.Mesh(spotGeo, spotMat);
      spot.position.set(pos.x, pos.y, pos.z);
      spot.lookAt(0, 0, 0);
      spot.scale.set(1.2, 1.2, 0.22);
      spot.translateZ(-0.12);
      bagGroup.add(spot);
    });

    // 眼睛
    this.createEyes(featureMat);

    // 眉毛
    this.createBrows(featureMat);

    // 嘴巴
    this.createMouth(featureMat);

    // 腮红
    this.createCheeks(cheekMat);

    // 手臂
    this.createArms(bodyMat);

    // 生成完成后重新居中
    this.recenterBag();
  }

  /**
   * 生成粘土噪点纹理（不依赖 DOM）
   */
  createClayNoiseTexture () {
    const THREE = this.THREE;
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.floor(Math.random() * 255);
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    return texture;
  }

  /**
   * 创建眼睛
   */
  createEyes (featureMat) {
    const THREE = this.THREE;

    const eyeGroup = new THREE.Group();
    this.bagMesh.add(eyeGroup);

    const eyeGeometry = new THREE.SphereGeometry(0.32, 32, 32);
    const eyeMaterial = featureMat || new THREE.MeshBasicMaterial({ color: 0x000000 });

    // 左眼
    this.eyeLeft = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.eyeLeft.position.set(-0.55, 0.1, 1.85);
    this.eyeLeft.scale.set(1, 1, 0.4);
    this.eyeLeft.rotation.x = -0.2;
    this.eyeLeft.rotation.y = -0.2;
    eyeGroup.add(this.eyeLeft);

    // 左眼神光（作为左眼的子对象）
    const highlightGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.eyeHighlightLeft = new THREE.Mesh(highlightGeometry, highlightMaterial);
    this.eyeHighlightLeft.position.set(-0.15, 0.15, 0.25); // 相对于眼睛的位置
    this.eyeLeft.add(this.eyeHighlightLeft);

    // 右眼
    this.eyeRight = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.eyeRight.position.set(0.55, 0.1, 1.85);
    this.eyeRight.scale.set(1, 1, 0.4);
    this.eyeRight.rotation.x = -0.2;
    this.eyeRight.rotation.y = 0.2;
    eyeGroup.add(this.eyeRight);

    // 右眼神光（作为右眼的子对象）
    this.eyeHighlightRight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    this.eyeHighlightRight.position.set(-0.15, 0.15, 0.25); // 相对于眼睛的位置
    this.eyeRight.add(this.eyeHighlightRight);
  }

  /**
   * 创建眉毛
   */
  createBrows (featureMat) {
    const THREE = this.THREE;
    const useCapsule = typeof THREE.CapsuleGeometry !== 'undefined';
    const browGeo = useCapsule
      ? new THREE.CapsuleGeometry(0.07, 0.45, 4, 16)
      : new THREE.CylinderGeometry(0.07, 0.07, 0.7, 12);

    const leftBrow = new THREE.Mesh(browGeo, featureMat);
    leftBrow.position.set(-0.6, 0.8, 1.82);
    leftBrow.rotation.set(-0.4, 0, -0.6);
    this.bagMesh.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeo, featureMat);
    rightBrow.position.set(0.6, 0.8, 1.82);
    rightBrow.rotation.set(-0.4, 0, 0.6);
    this.bagMesh.add(rightBrow);
  }

  /**
   * 创建嘴巴
   */
  createMouth (featureMat) {
    const THREE = this.THREE;

    // 使用曲线创建嘴巴
    this.mouthGroup = new THREE.Group();

    // 创建嘴巴曲线
    const points = [];
    const mouthWidth = 0.5;
    const mouthY = -0.4;

    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const x = (t - 0.5) * mouthWidth * 2;
      const y = mouthY + Math.sin(t * Math.PI) * 0.12 * this.mouthCurve;
      points.push(new THREE.Vector3(x, y, 1.95));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 32, 0.08, 12, false);
    const tubeMaterial = featureMat || new THREE.MeshBasicMaterial({ color: 0x000000 });
    const mouthTube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    mouthTube.rotation.z = Math.PI; // 倒 U 形
    this.mouthGroup.add(mouthTube);

    this.bagMesh.add(this.mouthGroup);
    this.recenterBag();
    this.frameBag();
  }

  /**
   * 创建腮红
   */
  createCheeks (cheekMat) {
    const THREE = this.THREE;
    const cheekGeo = new THREE.CircleGeometry(0.35, 32);

    const c1 = new THREE.Mesh(cheekGeo, cheekMat);
    c1.position.set(-1.1, -0.25, 1.78);
    c1.rotation.y = -0.5;
    this.bagMesh.add(c1);

    const c2 = new THREE.Mesh(cheekGeo, cheekMat);
    c2.position.set(1.1, -0.25, 1.78);
    c2.rotation.y = 0.5;
    this.bagMesh.add(c2);
  }

  /**
   * 创建手臂
   */
  createArms (bodyMat) {
    const THREE = this.THREE;
    const armGroup = new THREE.Group();
    this.bagMesh.add(armGroup);

    const useCapsule = typeof THREE.CapsuleGeometry !== 'undefined';
    const limbGeo = useCapsule
      ? new THREE.CapsuleGeometry(0.35, 0.8, 8, 16)
      : new THREE.CylinderGeometry(0.35, 0.35, 1.2, 16);
    const handGeo = new THREE.SphereGeometry(0.4, 16, 16);

    const createArm = (isLeft) => {
      const arm = new THREE.Group();

      const limb = new THREE.Mesh(limbGeo, bodyMat);
      limb.position.y = 0.4;
      limb.castShadow = true;
      arm.add(limb);

      const hand = new THREE.Mesh(handGeo, bodyMat);
      hand.position.y = 0.9;
      hand.scale.set(1, 0.8, 1.2);
      arm.add(hand);

      if (isLeft) {
        arm.position.set(-1.6, -0.6, 0.8);
        arm.rotation.set(0.5, -0.5, -2.2);
      } else {
        arm.position.set(1.6, -0.6, 0.8);
        arm.rotation.set(0.5, 0.5, 2.2);
      }
      return arm;
    };

    armGroup.add(createArm(true));
    armGroup.add(createArm(false));
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
    if (this.bagMesh) {
      this.bagMesh.remove(this.mouthGroup);
    } else {
      this.scene.remove(this.mouthGroup);
    }
    this.mouthGroup = new THREE.Group();

    // 创建新的嘴巴曲线
    const points = [];
    const mouthWidth = 0.5;
    const mouthY = -0.4;

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
      points.push(new THREE.Vector3(x, y, 1.95));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 24, 0.08, 12, false);
    const tubeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const mouthTube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    mouthTube.rotation.z = Math.PI;
    this.mouthGroup.add(mouthTube);

    if (this.bagMesh) {
      this.bagMesh.add(this.mouthGroup);
    } else {
      this.scene.add(this.mouthGroup);
    }
    this.recenterBag();
    this.frameBag();
  }

  /**
   * 根据当前模型包围盒将模型整体移到原点，保持上下左右居中
   */
  recenterBag () {
    if (!this.bagMesh || !this.THREE) return;
    const THREE = this.THREE;
    const box = new THREE.Box3().setFromObject(this.bagMesh);
    const center = new THREE.Vector3();
    box.getCenter(center);
    this.bagMesh.position.sub(center);
    if (this.camera) {
      this.camera.lookAt(0, 0, 0);
    }
  }

  /**
   * 根据模型大小重设相机距离，确保画面中心对齐并填充视野
   */
  frameBag () {
    if (!this.bagMesh || !this.camera || !this.THREE) return;
    const THREE = this.THREE;
    const box = new THREE.Box3().setFromObject(this.bagMesh);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const fov = this.camera.fov * Math.PI / 180;
    const distance = sphere.radius / Math.sin(fov / 2);
    this.camera.position.set(0, 0, distance * 1.15);
    this.camera.lookAt(0, 0, 0);
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
