/**
 * 受气包模型库 - 仅保留哆啦A梦模型
 */

function createDoraemonBag (THREE, materials) {
  const group = new THREE.Group();
  group.name = 'doraemon_bag';

  // 材质定义 - 颜色优化
  const blueMaterial = new THREE.MeshStandardMaterial({
    color: 0x0095D9, // 哆啦A梦官方蓝
    roughness: 0.4,
    metalness: 0.1
  });

  const whiteMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    roughness: 0.4,
    metalness: 0.1
  });

  const redMaterial = new THREE.MeshStandardMaterial({
    color: 0xD90000,
    roughness: 0.3,
    metalness: 0.1
  });

  const yellowMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    roughness: 0.3,
    metalness: 0.4
  });

  const blackMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000
  });

  // --- 头部 ---
  const headGroup = new THREE.Group();
  group.add(headGroup);

  // 蓝头 - 稍微大一点
  const headGeo = new THREE.SphereGeometry(1.5, 32, 32);
  const head = new THREE.Mesh(headGeo, blueMaterial);
  head.position.y = 1.2;
  head.castShadow = false;
  headGroup.add(head);

  // 设为主要受击Mesh
  group.bodyMesh = head;

  // 白脸 - 调整位置和大小
  const faceGeo = new THREE.SphereGeometry(1.25, 32, 32);
  const face = new THREE.Mesh(faceGeo, whiteMaterial);
  face.scale.set(1, 0.9, 0.85);
  face.position.set(0, 1.1, 0.45);
  face.rotation.x = -0.15;
  headGroup.add(face);

  // --- 眼睛 ---
  // 眼睛组
  const eyeGroup = new THREE.Group();
  headGroup.add(eyeGroup);

  const eyeGeo = new THREE.SphereGeometry(0.38, 24, 24);

  // 左眼容器 (用于动画控制)
  const leftEyeContainer = new THREE.Group();
  leftEyeContainer.position.set(-0.38, 2.25, 1.25);
  eyeGroup.add(leftEyeContainer);

  // 左眼网格 - 竖直椭圆
  const leftEye = new THREE.Mesh(eyeGeo, whiteMaterial);
  leftEye.scale.set(1, 1.35, 0.6);
  leftEye.rotation.x = -0.1;
  leftEye.rotation.z = 0.05;
  leftEyeContainer.add(leftEye);

  // 右眼容器
  const rightEyeContainer = new THREE.Group();
  rightEyeContainer.position.set(0.38, 2.25, 1.25);
  eyeGroup.add(rightEyeContainer);

  // 右眼网格
  const rightEye = new THREE.Mesh(eyeGeo, whiteMaterial);
  rightEye.scale.set(1, 1.35, 0.6);
  rightEye.rotation.x = -0.1;
  rightEye.rotation.z = -0.05;
  rightEyeContainer.add(rightEye);

  // 瞳孔 - 稍微靠内斗鸡眼一点点更可爱
  const pupilGeo = new THREE.SphereGeometry(0.09, 12, 12);
  const highlightGeo = new THREE.SphereGeometry(0.03, 8, 8); // 眼神光

  // 左眼瞳孔
  const leftPupil = new THREE.Mesh(pupilGeo, blackMaterial);
  leftPupil.scale.set(1, 1, 0.5);
  leftPupil.position.set(0.12, 0.1, 0.32);
  leftEye.add(leftPupil);

  // 左眼高光
  const leftHighlight = new THREE.Mesh(highlightGeo, whiteMaterial);
  leftHighlight.position.set(0.03, 0.03, 0.08);
  leftPupil.add(leftHighlight);

  // 右眼瞳孔
  const rightPupil = new THREE.Mesh(pupilGeo, blackMaterial);
  rightPupil.scale.set(1, 1, 0.5);
  rightPupil.position.set(-0.12, 0.1, 0.32);
  rightEye.add(rightPupil);

  // 右眼高光
  const rightHighlight = new THREE.Mesh(highlightGeo, whiteMaterial);
  rightHighlight.position.set(-0.03, 0.03, 0.08);
  rightPupil.add(rightHighlight);

  // 暴露给 bag_3d.js 使用的是容器
  group.userData.eyeLeft = leftEyeContainer;
  group.userData.eyeRight = rightEyeContainer;

  // --- 鼻子 ---
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), redMaterial);
  nose.position.set(0, 1.95, 1.55);
  nose.castShadow = false;
  headGroup.add(nose);

  // 鼻子高光
  const noseHighlight = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), whiteMaterial);
  noseHighlight.position.set(0.08, 2.05, 1.68);
  headGroup.add(noseHighlight);

  // --- 胡须 ---
  const whiskerGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.9, 6);
  const whiskerY = [1.8, 1.7, 1.6];

  whiskerY.forEach((y, i) => {
    const angle = (i - 1) * 0.15;

    // 左胡须
    const l = new THREE.Mesh(whiskerGeo, blackMaterial);
    l.position.set(-0.7, y, 1.35);
    l.rotation.z = Math.PI / 2 + angle;
    l.rotation.y = 0.25;
    headGroup.add(l);

    // 右胡须
    const r = new THREE.Mesh(whiskerGeo, blackMaterial);
    r.position.set(0.7, y, 1.35);
    r.rotation.z = Math.PI / 2 - angle;
    r.rotation.y = -0.25;
    headGroup.add(r);
  });

  // --- 嘴巴 (垂直线) ---
  const mouthLine = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 8), blackMaterial);
  mouthLine.position.set(0, 1.5, 1.48);
  headGroup.add(mouthLine);

  // 微笑嘴型 (使用Torus的一部分)
  const smileGeo = new THREE.TorusGeometry(0.7, 0.018, 8, 32, Math.PI);
  const smile = new THREE.Mesh(smileGeo, blackMaterial);
  smile.position.set(0, 1.5, 1.4);
  smile.rotation.x = Math.PI / 1.15; // 稍微倾斜贴合脸部
  headGroup.add(smile);

  // --- 身体 ---
  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);

  // 躯干 - 稍微胖一点
  const bodyGeo = new THREE.CylinderGeometry(1.2, 1.2, 1.5, 32);
  const body = new THREE.Mesh(bodyGeo, blueMaterial);
  body.position.y = -0.1;
  body.castShadow = false;
  bodyGroup.add(body);

  // 肚皮
  const bellyGeo = new THREE.SphereGeometry(1.0, 32, 32);
  const belly = new THREE.Mesh(bellyGeo, whiteMaterial);
  belly.scale.set(1, 1.1, 0.6);
  belly.position.set(0, -0.2, 0.7);
  bodyGroup.add(belly);

  // 口袋 (半圆)
  const pocketGeo = new THREE.CircleGeometry(0.7, 24, 0, Math.PI);
  const pocket = new THREE.Mesh(pocketGeo, whiteMaterial);
  pocket.position.set(0, -0.2, 1.25);
  pocket.rotation.z = Math.PI; // 开口向上

  const pocketBorder = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.015, 8, 24, Math.PI), blackMaterial);
  pocketBorder.position.set(0, -0.2, 1.25);
  pocketBorder.rotation.z = Math.PI;
  bodyGroup.add(pocketBorder);
  bodyGroup.add(pocket);

  // --- 项圈和铃铛 ---
  const collar = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.12, 12, 32), redMaterial);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.6;
  group.add(collar);

  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), yellowMaterial);
  bell.position.set(0, 0.35, 1.25);
  bell.castShadow = false;
  group.add(bell);

  // 铃铛细节
  const bellHole = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), blackMaterial);
  bellHole.position.set(0, 0.25, 1.48);
  group.add(bellHole);

  const bellLine = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 6), blackMaterial);
  bellLine.position.set(0, 0.15, 1.45);
  bellLine.rotation.x = Math.PI / 2;
  group.add(bellLine);

  // --- 手臂 ---
  const armGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.7, 16);
  const handGeo = new THREE.SphereGeometry(0.4, 16, 16);

  // 左臂
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-1.15, 0.3, 0); // 稍微降低一点
  leftArmGroup.rotation.z = Math.PI / 6; // 角度减小，更自然下垂

  const leftArm = new THREE.Mesh(armGeo, blueMaterial);
  leftArm.position.y = -0.35;
  leftArmGroup.add(leftArm);

  const leftHand = new THREE.Mesh(handGeo, whiteMaterial);
  leftHand.position.y = -0.7;
  leftArmGroup.add(leftHand);

  group.add(leftArmGroup);

  // 右臂
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(1.15, 0.3, 0);
  rightArmGroup.rotation.z = -Math.PI / 6;

  const rightArm = new THREE.Mesh(armGeo, blueMaterial);
  rightArm.position.y = -0.35;
  rightArmGroup.add(rightArm);

  const rightHand = new THREE.Mesh(handGeo, whiteMaterial);
  rightHand.position.y = -0.7;
  rightArmGroup.add(rightHand);

  group.add(rightArmGroup);

  // --- 腿脚 ---
  const legGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.5, 16);
  // 稍微圆润一点的脚，用Sphere拉伸模拟
  const roundFootGeo = new THREE.SphereGeometry(0.5, 16, 16);

  // 左腿
  const leftLeg = new THREE.Mesh(legGeo, blueMaterial);
  leftLeg.position.set(-0.55, -1.0, 0);
  group.add(leftLeg);

  const leftFoot = new THREE.Mesh(roundFootGeo, whiteMaterial);
  leftFoot.scale.set(0.9, 0.5, 1.3); // 稍微加厚一点，更像图片里的圆润感
  leftFoot.position.set(-0.55, -1.35, 0.15);
  group.add(leftFoot);

  // 右腿
  const rightLeg = new THREE.Mesh(legGeo, blueMaterial);
  rightLeg.position.set(0.55, -1.0, 0);
  group.add(rightLeg);

  const rightFoot = new THREE.Mesh(roundFootGeo, whiteMaterial);
  rightFoot.scale.set(0.9, 0.5, 1.3);
  rightFoot.position.set(0.55, -1.35, 0.15);
  group.add(rightFoot);

  // --- 尾巴 ---
  const tailGeo = new THREE.SphereGeometry(0.25, 16, 16);
  const tail = new THREE.Mesh(tailGeo, redMaterial);
  tail.position.set(0, -0.8, -1.3);
  group.add(tail); return group;
}

/**
 * 包模型定义表
 */
const BAG_MODELS = {
  doraemon: {
    id: 'doraemon',
    name: '哆啦A梦包',
    description: '经典蓝胖猫造型，满满童年记忆',
    rarity: 'legendary',
    creator: createDoraemonBag
  }
};

module.exports = {
  BAG_MODELS,
  createDoraemonBag
};
