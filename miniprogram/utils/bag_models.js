/**
 * 受气包模型库 - 多种Three.js生成的包模型
 * 包含：经典包、Q弹包、刺猬包、方块包、星形包、水果包等
 */

/**
 * 创建经典圆形受气包
 */
function createClassicalBag (THREE, materials) {
  const group = new THREE.Group();
  group.name = 'classical_bag';

  // 主体球体
  const bodyGeometry = new THREE.IcosahedronGeometry(1.2, 5);
  const body = new THREE.Mesh(bodyGeometry, materials.bagBody);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // 添加表情系统的引用
  group.bodyMesh = body;
  return group;
}

/**
 * 创建Q弹果冻包 - 软弹感
 */
function createJellyBag (THREE, materials) {
  const group = new THREE.Group();
  group.name = 'jelly_bag';

  // 创建不规则的球形，用Perlin噪声参数化
  const geometry = new THREE.IcosahedronGeometry(1.2, 6);
  const positions = geometry.attributes.position.array;

  // 添加软体感的形变
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    const noise = Math.sin(x * 3) * Math.cos(y * 3) * Math.sin(z * 3) * 0.15;
    const len = Math.sqrt(x * x + y * y + z * z);

    positions[i] = (x / len) * (1.2 + noise);
    positions[i + 1] = (y / len) * (1.2 + noise);
    positions[i + 2] = (z / len) * (1.2 + noise);
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();

  // 使用玻璃材质增强果冻感
  const jellyMaterial = materials.bagGlass.clone();
  jellyMaterial.transparent = true;
  jellyMaterial.opacity = 0.85;

  const body = new THREE.Mesh(geometry, jellyMaterial);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  group.bodyMesh = body;
  return group;
}

/**
 * 创建刺猬包 - 全身带刺
 */
function createHedgehogBag (THREE, materials) {
  const group = new THREE.Group();
  group.name = 'hedgehog_bag';

  // 主体
  const bodyGeometry = new THREE.IcosahedronGeometry(1.0, 4);
  const body = new THREE.Mesh(bodyGeometry, materials.bagBody);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // 添加刺
  const positions = bodyGeometry.attributes.position.array;
  const spikes = [];

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    const len = Math.sqrt(x * x + y * y + z * z);
    const nx = x / len;
    const ny = y / len;
    const nz = z / len;

    // 每个顶点上创建一个刺
    if (Math.random() > 0.3) {
      const spikeGeometry = new THREE.ConeGeometry(0.08, 0.5, 8);
      const spikeMesh = new THREE.Mesh(spikeGeometry, materials.bagAccent);

      // 放置在表面外侧
      spikeMesh.position.set(
        (nx * 1.0 + nx * 0.25),
        (ny * 1.0 + ny * 0.25),
        (nz * 1.0 + nz * 0.25)
      );

      // 朝向外侧
      spikeMesh.lookAt(nx * 2, ny * 2, nz * 2);
      spikeMesh.castShadow = true;
      spikes.push(spikeMesh);
      group.add(spikeMesh);
    }
  }

  group.bodyMesh = body;
  group.spikes = spikes;
  return group;
}

/**
 * 创建方块包 - 立方体风格
 */
function createCubeBag (THREE, materials) {
  const group = new THREE.Group();
  group.name = 'cube_bag';

  // 创建圆角立方体效果（使用修改过的box geometry）
  const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5, 16, 16, 16);

  // 对顶点进行球形处理实现圆角
  const positions = geometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    let x = positions[i];
    let y = positions[i + 1];
    let z = positions[i + 2];

    const len = Math.sqrt(x * x + y * y + z * z);
    if (len > 0) {
      // 介于立方体和球体之间
      const factor = 0.7;
      positions[i] = x * factor + (x / len) * 0.9 * (1 - factor);
      positions[i + 1] = y * factor + (y / len) * 0.9 * (1 - factor);
      positions[i + 2] = z * factor + (z / len) * 0.9 * (1 - factor);
    }
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();

  const body = new THREE.Mesh(geometry, materials.bagBody);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  group.bodyMesh = body;
  return group;
}

/**
 * 创建星形包 - 多角星状
 */
function createStarBag (THREE, materials) {
  const group = new THREE.Group();
  group.name = 'star_bag';

  // 创建基础球体
  const baseGeometry = new THREE.IcosahedronGeometry(0.8, 4);
  const body = new THREE.Mesh(baseGeometry, materials.bagBody);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // 添加星形凸起
  const positions = baseGeometry.attributes.position.array;
  const starPoints = [];

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    const len = Math.sqrt(x * x + y * y + z * z);
    const nx = x / len;
    const ny = y / len;
    const nz = z / len;

    // 每个面创建一个凸起
    if (i % 9 === 0) {
      const pointGeometry = new THREE.TetrahedronGeometry(0.25, 2);
      const pointMesh = new THREE.Mesh(pointGeometry, materials.bagAccent);

      pointMesh.position.set(
        nx * 1.2,
        ny * 1.2,
        nz * 1.2
      );

      pointMesh.lookAt(nx * 2, ny * 2, nz * 2);
      pointMesh.castShadow = true;
      starPoints.push(pointMesh);
      group.add(pointMesh);
    }
  }

  group.bodyMesh = body;
  group.starPoints = starPoints;
  return group;
}

/**
 * 创建水果包 - 橙色带香蕉造型
 */
function createFruitBag (THREE, materials) {
  const group = new THREE.Group();
  group.name = 'fruit_bag';

  // 主体 - 橙子形状（略扁平的球体）
  const bodyGeometry = new THREE.SphereGeometry(1.0, 32, 24);
  const bodyMaterial = materials.bagBody.clone();

  // 修改位置使其略微扁平
  const positions = bodyGeometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 1] *= 0.85; // 压扁Y轴
  }
  bodyGeometry.attributes.position.needsUpdate = true;

  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // 添加柑橘纹理 - 通过小球堆积
  const segments = 8;
  for (let lat = 0; lat < segments; lat++) {
    for (let lon = 0; lon < segments * 1.5; lon++) {
      const theta = (lat / segments) * Math.PI;
      const phi = (lon / (segments * 1.5)) * Math.PI * 2;

      if (Math.random() > 0.6) {
        const x = Math.sin(theta) * Math.cos(phi) * 1.0;
        const y = Math.cos(theta) * 0.85;
        const z = Math.sin(theta) * Math.sin(phi) * 1.0;

        const segmentGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const segmentMesh = new THREE.Mesh(segmentGeometry, materials.bagAccent);

        segmentMesh.position.set(x, y, z);
        segmentMesh.castShadow = true;
        group.add(segmentMesh);
      }
    }
  }

  // 添加香蕉形状的装饰
  const bananaGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 12, 1);
  const bananaMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
  const banana = new THREE.Mesh(bananaGeometry, bananaMaterial);

  banana.position.set(0.6, 0.9, 0.3);
  banana.rotation.z = Math.PI / 4;
  banana.castShadow = true;
  group.add(banana);

  group.bodyMesh = body;
  return group;
}

/**
 * 创建毛绒包 - 表面覆盖毛发
 */
function createFuzzyBag (THREE, materials) {
  const group = new THREE.Group();
  group.name = 'fuzzy_bag';

  // 主体球体
  const bodyGeometry = new THREE.IcosahedronGeometry(1.2, 5);
  const body = new THREE.Mesh(bodyGeometry, materials.bagBody);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // 添加毛发 - 从表面发射出线段
  const positions = bodyGeometry.attributes.position.array;
  const hairStrands = [];

  for (let i = 0; i < positions.length; i += 3) {
    if (Math.random() > 0.7) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];

      const len = Math.sqrt(x * x + y * y + z * z);
      const nx = x / len;
      const ny = y / len;
      const nz = z / len;

      // 创建毛发线段
      const hairGeometry = new THREE.CylinderGeometry(0.02, 0.01, 0.25, 4, 1);
      const hairMaterial = new THREE.MeshStandardMaterial({
        color: 0xAA8866,
        metalness: 0.1,
        roughness: 0.8
      });
      const hairMesh = new THREE.Mesh(hairGeometry, hairMaterial);

      hairMesh.position.set(
        nx * 1.2,
        ny * 1.2,
        nz * 1.2
      );

      hairMesh.lookAt(
        nx * 1.5,
        ny * 1.5,
        nz * 1.5
      );

      hairMesh.castShadow = true;
      hairStrands.push(hairMesh);
      group.add(hairMesh);
    }
  }

  group.bodyMesh = body;
  group.hairStrands = hairStrands;
  return group;
}

/**
 * 创建结晶包 - 水晶/钻石质感
 */
function createCrystalBag (THREE, materials) {
  const group = new THREE.Group();
  group.name = 'crystal_bag';

  // 使用十二面体创建多面体效果
  const bodyGeometry = new THREE.DodecahedronGeometry(1.0, 1);

  // 应用玻璃/水晶材质
  const crystalMaterial = materials.bagGlass.clone();
  crystalMaterial.transparent = true;
  crystalMaterial.opacity = 0.9;
  crystalMaterial.metalness = 0.2;
  crystalMaterial.roughness = 0.1;

  const body = new THREE.Mesh(bodyGeometry, crystalMaterial);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // 添加内部晶体结构 - 发光的线框
  const edges = new THREE.EdgesGeometry(bodyGeometry);
  const wireframe = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0x00FFFF, linewidth: 2 })
  );
  group.add(wireframe);

  group.bodyMesh = body;
  group.wireframe = wireframe;
  return group;
}

/**
 * 创建火焰包 - 表面带有火焰效果
 */
function createFlameBag (THREE, materials) {
  const group = new THREE.Group();
  group.name = 'flame_bag';

  // 主体
  const bodyGeometry = new THREE.IcosahedronGeometry(1.1, 5);
  const body = new THREE.Mesh(bodyGeometry, materials.bagBody);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // 添加火焰形状的凸起
  const flameCount = 12;
  const flames = [];

  for (let i = 0; i < flameCount; i++) {
    const angle = (i / flameCount) * Math.PI * 2;
    const height = Math.random() * 0.6 + 0.4;

    // 火焰形状 - 圆锥+球体组合
    const flameGroup = new THREE.Group();

    const coneGeometry = new THREE.ConeGeometry(0.15, 0.5, 8);
    const flameMaterial = new THREE.MeshStandardMaterial({
      color: Math.random() > 0.5 ? 0xFF6B00 : 0xFFDD00,
      emissive: 0xFF4400,
      emissiveIntensity: 0.8,
      metalness: 0,
      roughness: 0.4
    });
    const cone = new THREE.Mesh(coneGeometry, flameMaterial);
    flameGroup.add(cone);

    flameGroup.position.set(
      Math.cos(angle) * 1.3,
      Math.sin(angle * 0.7) * 0.5,
      Math.sin(angle) * 1.3
    );

    flameGroup.castShadow = true;
    flames.push(flameGroup);
    group.add(flameGroup);
  }

  group.bodyMesh = body;
  group.flames = flames;
  return group;
}

/**
 * 创建金属包 - 金属质感
 */
function createMetalBag (THREE, materials) {
  const group = new THREE.Group();
  group.name = 'metal_bag';

  const bodyGeometry = new THREE.IcosahedronGeometry(1.2, 6);

  const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0xC0C0C0,
    metalness: 0.95,
    roughness: 0.1,
    envMap: null
  });

  const body = new THREE.Mesh(bodyGeometry, metalMaterial);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // 添加金属条纹
  const positions = bodyGeometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    if (i % 30 === 0) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];

      const len = Math.sqrt(x * x + y * y + z * z);

      const stripGeometry = new THREE.BoxGeometry(0.05, 0.8, 0.05);
      const stripMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        metalness: 0.8,
        roughness: 0.2
      });
      const strip = new THREE.Mesh(stripGeometry, stripMaterial);

      strip.position.set(x * 1.2, y * 1.2, z * 1.2);
      strip.lookAt(0, 0, 0);
      strip.castShadow = true;
      group.add(strip);
    }
  }

  group.bodyMesh = body;
  return group;
}

/**
 * 包模型定义表
 */
const BAG_MODELS = {
  classical: {
    id: 'classical',
    name: '经典圆形包',
    description: '经典的圆形受气包，圆润可爱',
    rarity: 'common',
    creator: createClassicalBag
  },
  jelly: {
    id: 'jelly',
    name: 'Q弹果冻包',
    description: '软弹感果冻体质，QQ软软',
    rarity: 'common',
    creator: createJellyBag
  },
  hedgehog: {
    id: 'hedgehog',
    name: '刺猬包',
    description: '全身带刺，气势十足',
    rarity: 'uncommon',
    creator: createHedgehogBag
  },
  cube: {
    id: 'cube',
    name: '方块包',
    description: '立方体风格，方正有力',
    rarity: 'uncommon',
    creator: createCubeBag
  },
  star: {
    id: 'star',
    name: '星形包',
    description: '多角星状，闪闪发光',
    rarity: 'rare',
    creator: createStarBag
  },
  fruit: {
    id: 'fruit',
    name: '水果包',
    description: '橙子形状，香甜多汁',
    rarity: 'rare',
    creator: createFruitBag
  },
  fuzzy: {
    id: 'fuzzy',
    name: '毛绒包',
    description: '毛茸茸的，柔软舒适',
    rarity: 'epic',
    creator: createFuzzyBag
  },
  crystal: {
    id: 'crystal',
    name: '结晶包',
    description: '水晶钻石质感，闪耀夺目',
    rarity: 'epic',
    creator: createCrystalBag
  },
  flame: {
    id: 'flame',
    name: '火焰包',
    description: '熊熊烈火，怒火涛涛',
    rarity: 'legendary',
    creator: createFlameBag
  },
  metal: {
    id: 'metal',
    name: '金属包',
    description: '坚硬金属质感，刚毅有力',
    rarity: 'legendary',
    creator: createMetalBag
  }
};

module.exports = {
  BAG_MODELS,
  createClassicalBag,
  createJellyBag,
  createHedgehogBag,
  createCubeBag,
  createStarBag,
  createFruitBag,
  createFuzzyBag,
  createCrystalBag,
  createFlameBag,
  createMetalBag
};
