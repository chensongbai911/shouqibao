/**
 * 受气包渲染器 - 使用 Three.js
 */

const { createScopedThreejs } = require('threejs-miniprogram');

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

const EXPRESSION_PRESETS = Object.freeze({
  normal: { eyeScale: { x: 1, y: 1 }, eyeRotation: 0, mouthCurve: 0.3 },
  hit: { eyeScale: { x: 1.5, y: 0.2 }, eyeRotation: 0, mouthCurve: -0.5 },
  crit: { eyeScale: { x: 1.2, y: 0.1 }, eyeRotation: Math.PI / 4, mouthCurve: -0.8 },
  dizzy: { eyeScale: { x: 1, y: 1 }, eyeRotation: Math.PI / 6, mouthCurve: -0.3 }
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

    this.body = new THREE.Mesh(geometries.body, materials.body);
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    this.bagMesh.add(this.body);

    BAG_LAYOUT.spots.forEach(({ position, radius }) => {
      const spot = new THREE.Mesh(this.getSpotGeometry(radius), materials.spot);
      spot.position.set(position[0], position[1], position[2]);
      spot.lookAt(0, 0, 0);
      spot.scale.set(1.2, 1.2, 0.22);
      spot.translateZ(-0.12);
      this.bagMesh.add(spot);
    });

    this.createEyes(materials.feature, materials.highlight, geometries.eye, geometries.highlight);
    this.createBrows(materials.feature, geometries.brow);
    this.createMouth(materials.mouth);
    this.createCheeks(materials.cheek, geometries.cheek);
    this.createArms(materials.body, geometries.limb, geometries.hand);
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
