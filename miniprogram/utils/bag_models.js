/**
 * 受气包模型库 - 仅保留哆啦A梦模型
 */

function createDoraemonBag (THREE, materials) {
  const group = new THREE.Group();
  group.name = 'doraemon_bag';

  // 材质定义 - 颜色优化 (参考图片色值)
  const blueMaterial = new THREE.MeshStandardMaterial({
    color: 0x0095D9, // 官方蓝
    roughness: 0.4,
    metalness: 0.1
  });

  const whiteMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    roughness: 0.3, // 稍微光滑一点
    metalness: 0.1
  });

  const redMaterial = new THREE.MeshStandardMaterial({
    color: 0xDD0000, // 鲜艳红
    roughness: 0.3,
    metalness: 0.2
  });

  const yellowMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    roughness: 0.2,
    metalness: 0.6 // 铃铛金属感强一点
  });

  const blackMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000
  });

  // --- 头部 ---
  const headGroup = new THREE.Group();
  group.add(headGroup);

  // 蓝头 - 更大更圆
  const headGeo = new THREE.SphereGeometry(1.65, 32, 32);
  const head = new THREE.Mesh(headGeo, blueMaterial);
  head.position.y = 1.3;
  head.castShadow = false;
  headGroup.add(head);

  // 设为主要受击Mesh
  group.bodyMesh = head;

  // 白脸 - 调整为宽扁的面罩形状，自然贴合
  const faceGeo = new THREE.SphereGeometry(1.45, 32, 32);
  const face = new THREE.Mesh(faceGeo, whiteMaterial);
  // x轴拉宽，z轴压扁，使其像一个面具贴在脸上
  face.scale.set(1.15, 1.0, 0.65);
  face.position.set(0, 1.15, 0.65);
  face.rotation.x = -0.15;
  headGroup.add(face);

  // --- 眼睛 ---
  // 眼睛组
  const eyeGroup = new THREE.Group();
  headGroup.add(eyeGroup);

  // 眼睛形状 - 巨大的竖椭圆
  const eyeGeo = new THREE.SphereGeometry(0.45, 24, 24);

  // 左眼容器
  const leftEyeContainer = new THREE.Group();
  // 位置更高，更靠中间
  leftEyeContainer.position.set(-0.44, 2.45, 1.35);
  eyeGroup.add(leftEyeContainer);

  // 左眼网格
  const leftEye = new THREE.Mesh(eyeGeo, whiteMaterial);
  leftEye.scale.set(1, 1.35, 0.6); // 竖长椭圆
  leftEye.rotation.x = -0.05;
  leftEye.rotation.z = 0.08; // 稍微向内倾斜
  leftEyeContainer.add(leftEye);

  // 右眼容器
  const rightEyeContainer = new THREE.Group();
  rightEyeContainer.position.set(0.44, 2.45, 1.35);
  eyeGroup.add(rightEyeContainer);

  // 右眼网格
  const rightEye = new THREE.Mesh(eyeGeo, whiteMaterial);
  rightEye.scale.set(1, 1.35, 0.6);
  rightEye.rotation.x = -0.05;
  rightEye.rotation.z = -0.08;
  rightEyeContainer.add(rightEye);

  // 瞳孔 - 黑色竖椭圆，对眼
  const pupilGeo = new THREE.SphereGeometry(0.11, 12, 12);
  const highlightGeo = new THREE.SphereGeometry(0.04, 8, 8);

  // 左眼瞳孔
  const leftPupil = new THREE.Mesh(pupilGeo, blackMaterial);
  leftPupil.scale.set(0.8, 1.1, 0.5);
  leftPupil.position.set(0.15, 0.1, 0.38); // 靠内
  leftEye.add(leftPupil);

  // 左眼高光
  const leftHighlight = new THREE.Mesh(highlightGeo, whiteMaterial);
  leftHighlight.position.set(0.04, 0.04, 0.09);
  leftPupil.add(leftHighlight);

  // 右眼瞳孔
  const rightPupil = new THREE.Mesh(pupilGeo, blackMaterial);
  rightPupil.scale.set(0.8, 1.1, 0.5);
  rightPupil.position.set(-0.15, 0.1, 0.38); // 靠内
  rightEye.add(rightPupil);

  // 右眼高光
  const rightHighlight = new THREE.Mesh(highlightGeo, whiteMaterial);
  rightHighlight.position.set(-0.04, 0.04, 0.09);
  rightPupil.add(rightHighlight);

  // 暴露给 bag_3d.js 使用的是容器
  group.userData.eyeLeft = leftEyeContainer;
  group.userData.eyeRight = rightEyeContainer;

  // --- 鼻子 ---
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), redMaterial);
  nose.position.set(0, 2.05, 1.7); // 紧贴眼睛下方
  nose.castShadow = false;
  headGroup.add(nose);

  // 鼻子高光
  const noseHighlight = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), whiteMaterial);
  noseHighlight.position.set(0.08, 2.15, 1.85);
  headGroup.add(noseHighlight);

  // --- 胡须 ---
  const whiskerGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.0, 6);
  const whiskerY = [1.85, 1.7, 1.55];

  whiskerY.forEach((y, i) => {
    const angle = (i - 1) * 0.18;

    // 左胡须
    const l = new THREE.Mesh(whiskerGeo, blackMaterial);
    l.position.set(-0.8, y, 1.45);
    l.rotation.z = Math.PI / 2 + angle;
    l.rotation.y = 0.3;
    headGroup.add(l);

    // 右胡须
    const r = new THREE.Mesh(whiskerGeo, blackMaterial);
    r.position.set(0.8, y, 1.45);
    r.rotation.z = Math.PI / 2 - angle;
    r.rotation.y = -0.3;
    headGroup.add(r);
  });

  // --- 嘴巴 ---
  const mouthLine = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.6, 6), blackMaterial);
  mouthLine.position.set(0, 1.55, 1.6);
  headGroup.add(mouthLine);

  // 大笑嘴型
  const smileGeo = new THREE.TorusGeometry(0.8, 0.02, 8, 32, Math.PI);
  const smile = new THREE.Mesh(smileGeo, blackMaterial);
  smile.position.set(0, 1.55, 1.5);
  smile.rotation.x = Math.PI / 1.15;
  headGroup.add(smile);

  // --- 身体 ---
  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);

  // 躯干 - 梨形身材 (上窄下宽)
  const bodyGeo = new THREE.CylinderGeometry(1.1, 1.35, 1.6, 32);
  const body = new THREE.Mesh(bodyGeo, blueMaterial);
  body.position.y = -0.1;
  body.castShadow = false;
  bodyGroup.add(body);

  // 肚皮 - 纯圆
  const bellyGeo = new THREE.SphereGeometry(1.05, 32, 32);
  const belly = new THREE.Mesh(bellyGeo, whiteMaterial);
  belly.scale.set(1, 1.05, 0.5);
  belly.position.set(0, -0.2, 0.85);
  bodyGroup.add(belly);

  // 口袋
  const pocketGeo = new THREE.CircleGeometry(0.75, 32, 0, Math.PI);
  const pocket = new THREE.Mesh(pocketGeo, whiteMaterial);
  pocket.position.set(0, -0.2, 1.36);
  pocket.rotation.z = Math.PI;

  const pocketBorder = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.015, 8, 32, Math.PI), blackMaterial);
  pocketBorder.position.set(0, -0.2, 1.36);
  pocketBorder.rotation.z = Math.PI;
  bodyGroup.add(pocketBorder);
  bodyGroup.add(pocket);

  // --- 项圈和铃铛 ---
  const collar = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.15, 12, 32), redMaterial);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.65;
  group.add(collar);

  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), yellowMaterial);
  bell.position.set(0, 0.35, 1.35);
  bell.castShadow = false;
  group.add(bell);

  // 铃铛细节
  const bellHole = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), blackMaterial);
  bellHole.position.set(0, 0.25, 1.6);
  group.add(bellHole);

  const bellLine = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 6), blackMaterial);
  bellLine.position.set(0, 0.15, 1.55);
  bellLine.rotation.x = Math.PI / 2;
  group.add(bellLine);

  // --- 手臂 ---
  const armGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16);
  const handGeo = new THREE.SphereGeometry(0.42, 16, 16);

  // 左臂 - 自然下垂
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-1.25, 0.3, 0);
  leftArmGroup.rotation.z = Math.PI / 8; // 角度更小，更自然

  const leftArm = new THREE.Mesh(armGeo, blueMaterial);
  leftArm.position.y = -0.3;
  leftArmGroup.add(leftArm);

  const leftHand = new THREE.Mesh(handGeo, whiteMaterial);
  leftHand.position.y = -0.7;
  leftArmGroup.add(leftHand);

  group.add(leftArmGroup);

  // 右臂
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(1.25, 0.3, 0);
  rightArmGroup.rotation.z = -Math.PI / 8;

  const rightArm = new THREE.Mesh(armGeo, blueMaterial);
  rightArm.position.y = -0.3;
  rightArmGroup.add(rightArm);

  const rightHand = new THREE.Mesh(handGeo, whiteMaterial);
  rightHand.position.y = -0.7;
  rightArmGroup.add(rightHand);

  group.add(rightArmGroup);

  // --- 腿脚 ---
  const legGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.5, 16);
  // 扁平大脚
  const footGeo = new THREE.SphereGeometry(0.55, 16, 16);

  // 左腿
  const leftLeg = new THREE.Mesh(legGeo, blueMaterial);
  leftLeg.position.set(-0.6, -1.0, 0);
  group.add(leftLeg);

  const leftFoot = new THREE.Mesh(footGeo, whiteMaterial);
  leftFoot.scale.set(1.0, 0.45, 1.5); // 宽大扁平
  leftFoot.position.set(-0.6, -1.35, 0.2);
  group.add(leftFoot);

  // 右腿
  const rightLeg = new THREE.Mesh(legGeo, blueMaterial);
  rightLeg.position.set(0.6, -1.0, 0);
  group.add(rightLeg);

  const rightFoot = new THREE.Mesh(footGeo, whiteMaterial);
  rightFoot.scale.set(1.0, 0.45, 1.5);
  rightFoot.position.set(0.6, -1.35, 0.2);
  group.add(rightFoot);

  // --- 尾巴 ---
  const tailGeo = new THREE.SphereGeometry(0.25, 16, 16);
  const tail = new THREE.Mesh(tailGeo, redMaterial);
  tail.position.set(0, -0.8, -1.4);
  group.add(tail);

  return group;
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
