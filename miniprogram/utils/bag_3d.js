/**
 * 受气包渲染器 - 使用 Three.js
 */

const { createScopedThreejs } = require('threejs-miniprogram');
const { BAG_MODELS } = require('./bag_models.js');

const DEFAULT_EXPRESSION = 'normal';
const STOP_EPSILON = 0.01;
const EXPRESSION_LERP = 0.18;
const PIXEL_RATIO_DENOMINATOR = 300;
const MOUTH_Z = 1.95;

const BAG_LAYOUT = Object.freeze({
  spots: [
    { position: [0, 1.6, 1.1], radius: 0.65 },
    { position: [-1.3, 1.2, 0.8], radius: 0.45 },
    { position: [1.4, 1.0, 0.9], radius: 0.48 },
    { position: [0, -1.6, 1.0], radius: 0.58 },
    { position: [-1.5, -1.0, 0.5], radius: 0.42 },
    { position: [1.5, -1.2, 0.5], radius: 0.42 },
    { position: [-0.8, 1.7, -0.5], radius: 0.42 },
    { position: [0.8, 1.7, -0.5], radius: 0.42 }
  ],
  cheeks: [
    { position: [-1.1, -0.25, 1.78], rotationY: -0.5 },
    { position: [1.1, -0.25, 1.78], rotationY: 0.5 }
  ],
  arms: {
    left: { position: [-1.6, -0.6, 0.8], rotation: [0.5, -0.5, -2.2] },
    right: { position: [1.6, -0.6, 0.8], rotation: [0.5, 0.5, 2.2] }
  }
});

const MOUTH_CONFIG = Object.freeze({
  segments: 24,
  width: 0.5,
  baseY: -0.4,
  amplitude: 0.1
});

// 渐进式受伤表情预设 - 基于累计伤害的表情变化
const EXPRESSION_PRESETS = Object.freeze({
  // 正常状态 - 开心自信
  normal: {
    eyeScale: { x: 1, y: 1 },
    eyeRotation: 0,
    mouthCurve: 0.3,
    cheekPuff: 0,
    eyeBrowAngle: 0
  },

  // 轻微受击 - 轻伤 (0-20% 血量损失)
  hit_light: {
    eyeScale: { x: 1.3, y: 0.4 },
    eyeRotation: 0,
    mouthCurve: 0,
    cheekPuff: 0.1,
    eyeBrowAngle: -0.1
  },

  // 中度受击 - 开始痛苦 (20-40% 血量损失)
  hit_medium: {
    eyeScale: { x: 1.5, y: 0.2 },
    eyeRotation: 0.1,
    mouthCurve: -0.3,
    cheekPuff: 0.3,
    eyeBrowAngle: -0.2
  },

  // 重度受击 - 很痛苦 (40-60% 血量损失)
  hit_heavy: {
    eyeScale: { x: 1.7, y: 0.15 },
    eyeRotation: 0.2,
    mouthCurve: -0.6,
    cheekPuff: 0.5,
    eyeBrowAngle: -0.3
  },

  // 严重受伤 - 快要哭了 (60-80% 血量损失)
  hurt_severe: {
    eyeScale: { x: 0.8, y: 1.4 },
    eyeRotation: 0.3,
    mouthCurve: -0.8,
    cheekPuff: 0.7,
    eyeBrowAngle: -0.4
  },

  // 濒死状态 - 眼冒金星 (80-100% 血量损失)
  dying: {
    eyeScale: { x: 0.5, y: 0.5 },
    eyeRotation: Math.PI / 3,
    mouthCurve: -1.0,
    cheekPuff: 1.0,
    eyeBrowAngle: -0.5
  },

  // 暴击特效 - 瞬间重击
  crit: {
    eyeScale: { x: 2.0, y: 0.1 },
    eyeRotation: Math.PI / 4,
    mouthCurve: -0.9,
    cheekPuff: 0.8,
    eyeBrowAngle: -0.6
  },

  // 眩晕状态 - 转圈圈
  dizzy: {
    eyeScale: { x: 1, y: 1 },
    eyeRotation: Math.PI / 6,
    mouthCurve: -0.3,
    cheekPuff: 0.4,
    eyeBrowAngle: -0.2
  }
});

const clayNoiseCache = new WeakMap();

function moveScalarTowards (current, target, factor) {
  if (Math.abs(current - target) <= STOP_EPSILON) {
    if (current === target) {
      return { value: current, changed: false };
    }
    return { value: target, changed: true };
  }
  return { value: current + (target - current) * factor, changed: true };
}

function getClayNoiseTexture (THREE) {
  if (clayNoiseCache.has(THREE)) {
    return clayNoiseCache.get(THREE);
  }

  const size = 256;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < data.length; i += 4) {
    const value = Math.floor(Math.random() * 255);
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 255;
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  clayNoiseCache.set(THREE, texture);
  return texture;
}

function buildMouthPoints (THREE, mouthCurve) {
  const points = [];
  const { segments, width, baseY, amplitude } = MOUTH_CONFIG;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = (t - 0.5) * width * 2;
    const sinValue = Math.sin(t * Math.PI);
    const delta = sinValue * amplitude * Math.abs(mouthCurve);
    const y = mouthCurve >= 0 ? baseY + delta : baseY - delta;
    points.push(new THREE.Vector3(x, y, MOUTH_Z));
  }

  return points;
}

function releaseClayNoiseTexture (THREE) {
  if (!THREE) return;
  const texture = clayNoiseCache.get(THREE);
  if (texture && typeof texture.dispose === 'function') {
    texture.dispose();
  }
  clayNoiseCache.delete(THREE);
}

class Bag3DRenderer {
  constructor(canvas, component) {
    this.canvas = canvas;
    this.component = component;

    this.THREE = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationFrameId = null;

    this.currentExpression = DEFAULT_EXPRESSION;

    this.bagMesh = null;
    this.body = null;
    this.eyeLeft = null;
    this.eyeRight = null;
    this.eyeHighlightLeft = null;
    this.eyeHighlightRight = null;
    this.mouthGroup = null;
    this.mouthTube = null;

    // 包模型系统
    this.currentBagModelId = 'classical'; // 默认包模型
    this.bagModelMesh = null; // 当前包的Three.js mesh

    this.squashAmount = 0;
    this.squashTarget = 0;
    this.squashSpeed = 0.15;
    this.rotationAngle = 0;
    this.targetRotationAngle = 0;

    this.eyeScale = { x: 1, y: 1 };
    this.eyeTarget = { x: 1, y: 1 };
    this.eyeRotation = 0;
    this.eyeRotationTarget = 0;

    this.mouthCurve = 0;
    this.mouthCurveTarget = 0;
    this.mouthDirty = false;

    // 受伤系统
    this.damageLevel = 0; // 0-100 的累计受伤程度
    this.bruises = []; // 青肿斑点数组
    this.swelling = 0; // 肿胀程度
    this.swellingTarget = 0;
    this.tears = []; // 眼泪粒子
    this.stars = []; // 眼冒金星效果

    this.width = 0;
    this.height = 0;

    this.resources = {
      materials: null,
      geometries: null,
      textures: null
    };

    this.needsRender = false;
    this.hasRenderedInitialExpression = false;
  }

  async init () {
    if (!this.canvas) {
      console.error('Canvas is not available');
      return;
    }

    this.THREE = createScopedThreejs(this.canvas);
    const THREE = this.THREE;

    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.scene = new THREE.Scene();
    this.scene.background = null;

    const aspect = this.width / this.height;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 0, 9.5);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.max(1, this.canvas.width / PIXEL_RATIO_DENOMINATOR));

    if (typeof this.renderer.physicallyCorrectLights !== 'undefined') {
      this.renderer.physicallyCorrectLights = true;
    }
    if (typeof this.renderer.toneMapping !== 'undefined') {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.1;
    }

    this.initializeResources();
    this.createBag();
    this.setupLights();

    this.changeExpression(DEFAULT_EXPRESSION);

    this.recenterBag();
    this.frameBag();

    console.log('Three.js 受气包渲染器初始化成功', this.width, this.height);

    this.requestRender();
  }

  initializeResources () {
    if (!this.THREE) return;
    const THREE = this.THREE;

    const clayNoiseMap = getClayNoiseTexture(THREE);

    const materials = {
      body: new THREE.MeshPhysicalMaterial({
        color: 0xffa8b8,
        roughness: 0.5,
        metalness: 0,
        bumpMap: clayNoiseMap,
        bumpScale: 0.015,
        clearcoat: 0.35,
        clearcoatRoughness: 0.35
      }),
      spot: new THREE.MeshPhysicalMaterial({
        color: 0xffbdd0,
        roughness: 0.35,
        metalness: 0,
        bumpMap: clayNoiseMap,
        bumpScale: 0.006,
        clearcoat: 0.65,
        clearcoatRoughness: 0.15
      }),
      feature: new THREE.MeshPhysicalMaterial({
        color: 0x2a1d25,
        roughness: 0.35,
        clearcoat: 0.4
      }),
      cheek: new THREE.MeshStandardMaterial({
        color: 0xff8da1,
        transparent: true,
        opacity: 0.7
      }),
      highlight: new THREE.MeshBasicMaterial({ color: 0xffffff }),
      mouth: new THREE.MeshBasicMaterial({ color: 0x000000 })
    };

    const useCapsule = typeof THREE.CapsuleGeometry !== 'undefined';
    const geometries = {
      body: new THREE.SphereGeometry(2, 64, 64),
      eye: new THREE.SphereGeometry(0.32, 24, 24),
      highlight: new THREE.SphereGeometry(0.08, 16, 16),
      cheek: new THREE.CircleGeometry(0.35, 24),
      brow: useCapsule
        ? new THREE.CapsuleGeometry(0.07, 0.45, 4, 12)
        : new THREE.CylinderGeometry(0.07, 0.07, 0.7, 12),
      limb: useCapsule
        ? new THREE.CapsuleGeometry(0.35, 0.8, 8, 12)
        : new THREE.CylinderGeometry(0.35, 0.35, 1.2, 12),
      hand: new THREE.SphereGeometry(0.4, 16, 16),
      spotVariants: new Map()
    };

    this.resources = {
      materials,
      geometries,
      textures: { clayNoiseMap }
    };
  }

  getSpotGeometry (radius) {
    const geometries = this.resources.geometries;
    const key = radius.toFixed(2);
    if (!geometries.spotVariants.has(key)) {
      geometries.spotVariants.set(key, new this.THREE.SphereGeometry(radius, 32, 32));
    }
    return geometries.spotVariants.get(key);
  }

  createBag () {
    const THREE = this.THREE;
    const { materials, geometries } = this.resources;

    this.bagMesh = new THREE.Group();
    this.scene.add(this.bagMesh);

    // 创建选定的包模型
    this.createBagModel(THREE, materials);

    this.createEyes(materials.feature, materials.highlight, geometries.eye, geometries.highlight);
    this.createBrows(materials.feature, geometries.brow);
    this.createMouth(materials.mouth);
    this.createCheeks(materials.cheek, geometries.cheek);
    this.createArms(materials.body, geometries.limb, geometries.hand);
  }

  /**
   * 根据currentBagModelId创建对应的包模型
   */
  createBagModel (THREE, materials) {
    const bagModelDef = BAG_MODELS[this.currentBagModelId];

    if (!bagModelDef) {
      console.warn(`包模型 ${this.currentBagModelId} 不存在，使用默认模型`);
      this.currentBagModelId = 'classical';
      return this.createBagModel(THREE, materials);
    }

    // 调用对应的创建函数
    const modelGroup = bagModelDef.creator(THREE, {
      bagBody: materials.body,
      bagGlass: materials.body,
      bagAccent: materials.spot
    });

    // 缩放模型适应现有的表情系统
    modelGroup.scale.set(0.6, 0.6, 0.6);

    this.bagMesh.add(modelGroup);
    this.bagModelMesh = modelGroup;
    this.body = modelGroup.bodyMesh; // 保持对body的引用用于表情系统

    // 原有的斑点系统（仅对经典模型保留）
    if (this.currentBagModelId === 'classical') {
      BAG_LAYOUT.spots.forEach(({ position, radius }) => {
        const spot = new THREE.Mesh(this.getSpotGeometry(radius), materials.spot);
        spot.position.set(position[0], position[1], position[2]);
        spot.lookAt(0, 0, 0);
        spot.scale.set(1.2, 1.2, 0.22);
        spot.translateZ(-0.12);
        this.bagMesh.add(spot);
      });
    }
  }

  /**
   * 切换包模型
   */
  changeBagModel (modelId) {
    if (!BAG_MODELS[modelId]) {
      console.error(`包模型 ${modelId} 不存在`);
      return false;
    }

    this.currentBagModelId = modelId;

    // 移除旧模型
    if (this.bagModelMesh) {
      this.bagMesh.remove(this.bagModelMesh);
      this.bagModelMesh.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    // 清理旧的身体引用
    this.body = null;

    // 创建新模型
    const THREE = this.THREE;
    const { materials } = this.resources;
    this.createBagModel(THREE, materials);

    // 应用当前表情
    this.changeExpression(this.currentExpression);

    this.requestRender();
    return true;
  }

  /**
   * 获取所有可用的包模型列表
   */
  getBagModelList () {
    return Object.values(BAG_MODELS).map(model => ({
      id: model.id,
      name: model.name,
      description: model.description,
      rarity: model.rarity
    }));
  }

  setupLights () {
    const THREE = this.THREE;

    const keyLight = new THREE.SpotLight(0xffffff, 3);
    keyLight.position.set(5, 8, 8);
    keyLight.angle = Math.PI / 4;
    keyLight.penumbra = 0.45;
    keyLight.castShadow = true;
    keyLight.shadow.bias = -0.0001;
    this.scene.add(keyLight);

    const ambientLight = new THREE.AmbientLight(0xffd1dc, 0.55);
    this.scene.add(ambientLight);

    const rimLight = new THREE.DirectionalLight(0xbadfff, 1.4);
    rimLight.position.set(-6, 3, -2);
    this.scene.add(rimLight);

    const bottomLight = new THREE.PointLight(0x6e5ce6, 1.2, 30);
    bottomLight.position.set(0, -5, 2);
    this.scene.add(bottomLight);
  }

  createEyes (featureMat, highlightMat, eyeGeometry, highlightGeometry) {
    const THREE = this.THREE;
    const eyeGroup = new THREE.Group();
    this.bagMesh.add(eyeGroup);

    this.eyeLeft = new THREE.Mesh(eyeGeometry, featureMat);
    this.eyeLeft.position.set(-0.55, 0.1, 1.85);
    this.eyeLeft.scale.set(1, 1, 0.4);
    this.eyeLeft.rotation.x = -0.2;
    this.eyeLeft.rotation.y = -0.2;
    eyeGroup.add(this.eyeLeft);

    this.eyeHighlightLeft = new THREE.Mesh(highlightGeometry, highlightMat);
    this.eyeHighlightLeft.position.set(-0.15, 0.15, 0.25);
    this.eyeLeft.add(this.eyeHighlightLeft);

    this.eyeRight = new THREE.Mesh(eyeGeometry, featureMat);
    this.eyeRight.position.set(0.55, 0.1, 1.85);
    this.eyeRight.scale.set(1, 1, 0.4);
    this.eyeRight.rotation.x = -0.2;
    this.eyeRight.rotation.y = 0.2;
    eyeGroup.add(this.eyeRight);

    this.eyeHighlightRight = new THREE.Mesh(highlightGeometry, highlightMat);
    this.eyeHighlightRight.position.set(-0.15, 0.15, 0.25);
    this.eyeRight.add(this.eyeHighlightRight);
  }

  createBrows (featureMat, browGeometry) {
    const leftBrow = new this.THREE.Mesh(browGeometry, featureMat);
    leftBrow.position.set(-0.6, 0.8, 1.82);
    leftBrow.rotation.set(-0.4, 0, -0.6);
    this.bagMesh.add(leftBrow);

    const rightBrow = new this.THREE.Mesh(browGeometry, featureMat);
    rightBrow.position.set(0.6, 0.8, 1.82);
    rightBrow.rotation.set(-0.4, 0, 0.6);
    this.bagMesh.add(rightBrow);
  }

  createMouth (mouthMaterial) {
    const THREE = this.THREE;
    this.mouthGroup = new THREE.Group();
    this.mouthTube = new THREE.Mesh(this.buildMouthGeometry(), mouthMaterial);
    this.mouthTube.rotation.z = Math.PI;
    this.mouthGroup.add(this.mouthTube);
    this.bagMesh.add(this.mouthGroup);
  }

  createCheeks (cheekMaterial, cheekGeometry) {
    BAG_LAYOUT.cheeks.forEach(({ position, rotationY }) => {
      const cheek = new this.THREE.Mesh(cheekGeometry, cheekMaterial);
      cheek.position.set(position[0], position[1], position[2]);
      cheek.rotation.y = rotationY;
      this.bagMesh.add(cheek);
    });
  }

  createArms (bodyMaterial, limbGeometry, handGeometry) {
    const armGroup = new this.THREE.Group();
    this.bagMesh.add(armGroup);

    const createArm = ({ position, rotation }) => {
      const arm = new this.THREE.Group();
      const limb = new this.THREE.Mesh(limbGeometry, bodyMaterial);
      limb.position.y = 0.4;
      limb.castShadow = true;
      arm.add(limb);

      const hand = new this.THREE.Mesh(handGeometry, bodyMaterial);
      hand.position.y = 0.9;
      hand.scale.set(1, 0.8, 1.2);
      arm.add(hand);

      arm.position.set(position[0], position[1], position[2]);
      arm.rotation.set(rotation[0], rotation[1], rotation[2]);
      return arm;
    };

    armGroup.add(createArm(BAG_LAYOUT.arms.left));
    armGroup.add(createArm(BAG_LAYOUT.arms.right));
  }

  changeExpression (expression) {
    const preset = EXPRESSION_PRESETS[expression];
    if (!preset) {
      console.warn(`Unknown expression: ${expression}`);
      return;
    }

    this.currentExpression = expression;
    this.applyExpressionPreset(preset);
  }

  /**
   * 根据累计伤害自动选择表情
   * @param {number} damagePercent - 伤害百分比 (0-100)
   */
  updateExpressionByDamage (damagePercent) {
    let expression = 'normal';

    if (damagePercent >= 80) {
      expression = 'dying'; // 濒死
    } else if (damagePercent >= 60) {
      expression = 'hurt_severe'; // 严重受伤
    } else if (damagePercent >= 40) {
      expression = 'hit_heavy'; // 重度受击
    } else if (damagePercent >= 20) {
      expression = 'hit_medium'; // 中度受击
    } else if (damagePercent >= 5) {
      expression = 'hit_light'; // 轻微受击
    }

    this.damageLevel = damagePercent;
    this.changeExpression(expression);

    // 更新肿胀程度
    this.swellingTarget = damagePercent / 100;
  }

  /**
   * 添加青肿斑点
   * @param {Object} position - 击打位置 {x, y, z}
   * @param {number} intensity - 强度 (0-1)
   */
  addBruise (position, intensity = 0.5) {
    if (!this.THREE || !this.bagMesh) return;

    const bruise = {
      position: position,
      intensity: intensity,
      size: 0.2 + intensity * 0.3,
      color: new this.THREE.Color().setHSL(0.75, 0.6, 0.2 + intensity * 0.3),
      age: 0,
      maxAge: 3000 + Math.random() * 2000, // 3-5秒消失
      mesh: null
    };

    // 创建青肿斑点的3D网格
    const bruiseGeometry = new this.THREE.SphereGeometry(bruise.size, 16, 16);
    const bruiseMaterial = new this.THREE.MeshBasicMaterial({
      color: bruise.color,
      transparent: true,
      opacity: 0.6 * intensity,
      depthWrite: false
    });

    bruise.mesh = new this.THREE.Mesh(bruiseGeometry, bruiseMaterial);
    bruise.mesh.position.copy(position);

    // 稍微浮出表面
    const normal = position.clone().normalize();
    bruise.mesh.position.addScaledVector(normal, 0.05);

    this.bagMesh.add(bruise.mesh);
    this.bruises.push(bruise);

    // 限制最多20个青肿
    if (this.bruises.length > 20) {
      const oldest = this.bruises.shift();
      if (oldest.mesh) {
        this.bagMesh.remove(oldest.mesh);
        oldest.mesh.geometry.dispose();
        oldest.mesh.material.dispose();
      }
    }

    this.requestRender();
  }

  /**
   * 更新青肿斑点（渐变消失）
   * @param {number} deltaTime - 时间增量
   */
  updateBruises (deltaTime) {
    if (!this.bruises.length) return;

    let needsUpdate = false;

    this.bruises = this.bruises.filter(bruise => {
      bruise.age += deltaTime;

      if (bruise.age >= bruise.maxAge) {
        // 移除过期的青肿
        if (bruise.mesh) {
          this.bagMesh.remove(bruise.mesh);
          bruise.mesh.geometry.dispose();
          bruise.mesh.material.dispose();
        }
        return false;
      }

      // 渐变透明
      const fadeProgress = bruise.age / bruise.maxAge;
      if (bruise.mesh && bruise.mesh.material) {
        bruise.mesh.material.opacity = (1 - fadeProgress) * 0.6 * bruise.intensity;
        needsUpdate = true;
      }

      return true;
    });

    if (needsUpdate) {
      this.requestRender();
    }
  }

  /**
   * 添加眼冒金星效果（濒死时）
   */
  addStarsEffect () {
    if (!this.THREE || !this.bagMesh) return;

    // 清除旧的星星
    this.stars.forEach(star => {
      if (star.mesh) {
        this.bagMesh.remove(star.mesh);
        star.mesh.geometry.dispose();
        star.mesh.material.dispose();
      }
    });
    this.stars = [];

    // 创建3-5颗旋转的星星
    const starCount = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < starCount; i++) {
      const angle = (i / starCount) * Math.PI * 2;
      const radius = 2.5;

      // 创建简单的星星形状
      const starGeometry = this.createStarGeometry(0.3);
      const starMaterial = new this.THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.9
      });

      const starMesh = new this.THREE.Mesh(starGeometry, starMaterial);
      starMesh.position.set(
        Math.cos(angle) * radius,
        2 + Math.sin(angle * 2) * 0.5,
        Math.sin(angle) * radius
      );

      this.bagMesh.add(starMesh);

      this.stars.push({
        mesh: starMesh,
        angle: angle,
        radius: radius,
        speed: 0.02 + Math.random() * 0.01
      });
    }

    this.requestRender();
  }

  /**
   * 创建星星几何体
   */
  createStarGeometry (size) {
    const shape = new this.THREE.Shape();
    const points = 5;
    const outerRadius = size;
    const innerRadius = size * 0.4;

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    shape.closePath();

    const geometry = new this.THREE.ShapeGeometry(shape);
    return geometry;
  }

  /**
   * 更新星星旋转动画
   */
  updateStars () {
    if (!this.stars.length) return;

    this.stars.forEach(star => {
      star.angle += star.speed;
      star.mesh.position.x = Math.cos(star.angle) * star.radius;
      star.mesh.position.z = Math.sin(star.angle) * star.radius;
      star.mesh.rotation.z += 0.05;
    });

    this.requestRender();
  }

  /**
   * 清除所有受伤效果
   */
  clearDamageEffects () {
    // 清除青肿
    this.bruises.forEach(bruise => {
      if (bruise.mesh) {
        this.bagMesh.remove(bruise.mesh);
        bruise.mesh.geometry.dispose();
        bruise.mesh.material.dispose();
      }
    });
    this.bruises = [];

    // 清除星星
    this.stars.forEach(star => {
      if (star.mesh) {
        this.bagMesh.remove(star.mesh);
        star.mesh.geometry.dispose();
        star.mesh.material.dispose();
      }
    });
    this.stars = [];

    // 重置状态
    this.damageLevel = 0;
    this.swellingTarget = 0;
    this.swelling = 0;

    this.changeExpression('normal');
    this.requestRender();
  }

  applyExpressionPreset (preset) {
    this.eyeTarget = { x: preset.eyeScale.x, y: preset.eyeScale.y };
    this.eyeRotationTarget = preset.eyeRotation;
    this.mouthCurveTarget = preset.mouthCurve;
    this.mouthDirty = true;

    if (!this.hasRenderedInitialExpression) {
      this.eyeScale = { x: this.eyeTarget.x, y: this.eyeTarget.y };
      this.eyeRotation = this.eyeRotationTarget;
      this.mouthCurve = this.mouthCurveTarget;
      if (this.mouthTube) {
        this.updateMouth(false);
      }
      this.hasRenderedInitialExpression = true;
    }

    this.requestRender();
  }

  setNormalExpression () {
    this.changeExpression('normal');
  }

  setHitExpression () {
    this.changeExpression('hit');
  }

  setCritExpression () {
    this.changeExpression('crit');
  }

  setDizzyExpression () {
    this.changeExpression('dizzy');
  }

  buildMouthGeometry () {
    const curve = new this.THREE.CatmullRomCurve3(buildMouthPoints(this.THREE, this.mouthCurve));
    return new this.THREE.TubeGeometry(curve, 24, 0.08, 12, false);
  }

  updateMouth (shouldRequestRender = true) {
    if (!this.mouthTube) return;
    const newGeometry = this.buildMouthGeometry();
    if (this.mouthTube.geometry) {
      this.mouthTube.geometry.dispose();
    }
    this.mouthTube.geometry = newGeometry;
    this.mouthDirty = false;
    if (shouldRequestRender) {
      this.requestRender();
    }
  }

  recenterBag () {
    if (!this.bagMesh || !this.THREE) return;
    const bounds = new this.THREE.Box3().setFromObject(this.bagMesh);
    const center = new this.THREE.Vector3();
    bounds.getCenter(center);
    this.bagMesh.position.sub(center);
    if (this.camera) {
      this.camera.lookAt(0, 0, 0);
    }
  }

  frameBag () {
    if (!this.bagMesh || !this.camera || !this.THREE) return;
    const bounds = new this.THREE.Box3().setFromObject(this.bagMesh);
    const sphere = bounds.getBoundingSphere(new this.THREE.Sphere());
    const fov = this.camera.fov * Math.PI / 180;
    const distance = sphere.radius / Math.sin(fov / 2);
    this.camera.position.set(0, 0, distance * 1.15);
    this.camera.lookAt(0, 0, 0);
  }

  hitAnimation (isCrit = false) {
    this.squashTarget = isCrit ? 0.5 : 0.3;
    this.targetRotationAngle = (Math.random() - 0.5) * 0.3;
    this.requestRender();
  }

  updateObjects () {
    if (!this.bagMesh || !this.eyeLeft || !this.eyeRight) return;

    const scaleY = 1 - this.squashAmount;
    const scaleX = 1 + this.squashAmount * 0.5;
    const scaleZ = 1 + this.squashAmount * 0.3;
    this.bagMesh.scale.set(scaleX, scaleY, scaleZ);

    this.bagMesh.rotation.z = this.rotationAngle;

    this.eyeLeft.scale.set(this.eyeScale.x, this.eyeScale.y, 1);
    this.eyeRight.scale.set(this.eyeScale.x, this.eyeScale.y, 1);
    this.eyeLeft.rotation.z = this.eyeRotation;
    this.eyeRight.rotation.z = this.eyeRotation;

    const highlightVisible = this.eyeScale.y > 0.5;
    if (this.eyeHighlightLeft) {
      this.eyeHighlightLeft.visible = highlightVisible;
    }
    if (this.eyeHighlightRight) {
      this.eyeHighlightRight.visible = highlightVisible;
    }
  }

  stepAnimation () {
    let active = false;

    // 更新受伤效果
    if (this.bruises.length > 0) {
      this.updateBruises(16); // 假设16ms每帧
      active = true;
    }

    // 更新星星旋转
    if (this.stars.length > 0) {
      this.updateStars();
      active = true;
    }

    if (Math.abs(this.squashAmount - this.squashTarget) > STOP_EPSILON) {
      this.squashAmount += (this.squashTarget - this.squashAmount) * this.squashSpeed;
      active = true;
    } else if (this.squashTarget !== 0) {
      this.squashTarget = 0;
      active = true;
    }

    if (Math.abs(this.rotationAngle - this.targetRotationAngle) > STOP_EPSILON) {
      this.rotationAngle += (this.targetRotationAngle - this.rotationAngle) * 0.1;
      active = true;
    } else if (this.targetRotationAngle !== 0) {
      this.targetRotationAngle = 0;
      active = true;
    }

    const expressionActive = this.stepExpressionTransition();

    return active || expressionActive;
  }

  stepExpressionTransition () {
    if (!this.hasRenderedInitialExpression) return false;

    let active = false;

    const eyeX = moveScalarTowards(this.eyeScale.x, this.eyeTarget.x, EXPRESSION_LERP);
    if (eyeX.changed) {
      this.eyeScale.x = eyeX.value;
      active = true;
    }

    const eyeY = moveScalarTowards(this.eyeScale.y, this.eyeTarget.y, EXPRESSION_LERP);
    if (eyeY.changed) {
      this.eyeScale.y = eyeY.value;
      active = true;
    }

    const eyeRot = moveScalarTowards(this.eyeRotation, this.eyeRotationTarget, EXPRESSION_LERP);
    if (eyeRot.changed) {
      this.eyeRotation = eyeRot.value;
      active = true;
    }

    const mouth = moveScalarTowards(this.mouthCurve, this.mouthCurveTarget, EXPRESSION_LERP);
    if (mouth.changed) {
      this.mouthCurve = mouth.value;
      this.mouthDirty = true;
      active = true;
    }

    if (this.mouthDirty && this.mouthTube) {
      this.updateMouth(false);
    }

    return active;
  }

  animate () {
    if (!this.renderer || !this.scene || !this.camera) return;

    this.animationFrameId = null;

    const hasActiveAnimation = this.stepAnimation();
    this.updateObjects();
    this.renderer.render(this.scene, this.camera);

    const shouldContinue = hasActiveAnimation || this.needsRender;
    this.needsRender = false;

    if (shouldContinue) {
      this.animationFrameId = this.canvas.requestAnimationFrame(() => {
        this.animate();
      });
    }
  }

  requestRender () {
    if (!this.renderer) return;
    this.needsRender = true;
    if (this.animationFrameId === null) {
      this.animationFrameId = this.canvas.requestAnimationFrame(() => {
        this.animate();
      });
    }
  }

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

    this.requestRender();
  }

  dispose () {
    const scopedThree = this.THREE;
    if (this.animationFrameId !== null) {
      this.canvas.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.scene) {
      this.scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else if (typeof object.material.dispose === 'function') {
            object.material.dispose();
          }
        }
      });
    }

    this.disposeResources();

    releaseClayNoiseTexture(scopedThree);

    if (this.renderer) {
      this.renderer.dispose();
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.THREE = null;
    this.bagMesh = null;
    this.bagModelMesh = null;
    this.body = null;
    this.eyeLeft = null;
    this.eyeRight = null;
    this.eyeHighlightLeft = null;
    this.eyeHighlightRight = null;
    this.mouthGroup = null;
    this.mouthTube = null;
  }

  disposeResources () {
    if (!this.resources || !this.resources.materials) return;
    const { materials, geometries } = this.resources;

    Object.keys(materials).forEach((key) => {
      const material = materials[key];
      if (material && typeof material.dispose === 'function') {
        material.dispose();
      }
    });

    Object.keys(geometries).forEach((key) => {
      const geometry = geometries[key];
      if (!geometry) return;
      if (geometry instanceof Map) {
        geometry.forEach((geo) => {
          if (geo && typeof geo.dispose === 'function') {
            geo.dispose();
          }
        });
        geometry.clear();
      } else if (typeof geometry.dispose === 'function') {
        geometry.dispose();
      }
    });

    this.resources = {
      materials: null,
      geometries: null,
      textures: null
    };
  }
}

module.exports = Bag3DRenderer;
