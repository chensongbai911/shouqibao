<template>
  <view class="game-page">
    <!-- 顶部栏 -->
    <view class="top-bar">
      <view class="settings-btn" @click="showSettings = true">
        ⚙️
      </view>

      <view class="score-display">
        <text class="score-label">得分</text>
        <text class="score-value">{{ gameStore.currentScore }}</text>
      </view>

      <view class="combo-display" v-if="gameStore.comboCount > 5">
        <text class="combo-text">{{ gameStore.comboCount }} Combo!</text>
      </view>
    </view>

    <!-- 血条/怒气槽 -->
    <view class="rage-bar">
      <view class="bar-fill" :style="{ width: ragePercent + '%' }"></view>
    </view>

    <!-- 受气包主体 -->
    <BagSprite @hit="onBagHit" />

    <!-- 伤害飘字特效层 -->
    <view class="hit-text-container">
      <HitText
        v-for="text in damageTexts"
        :key="text.id"
        :damage="text.damage"
        :isCritical="text.isCritical"
        :x="text.x"
        :y="text.y"
      />
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-dock">
      <view class="dock-btn" @click="showWeaponPanel = true">
        <text class="btn-icon">🥊</text>
        <text class="btn-label">武器库</text>
      </view>

      <view class="dock-btn" @click="chooseFace">
        <text class="btn-icon">📸</text>
        <text class="btn-label">换脸</text>
      </view>

      <view class="dock-btn" @click="showRanking">
        <text class="btn-icon">🏆</text>
        <text class="btn-label">排行榜</text>
      </view>
    </view>

    <!-- 武器选择弹窗 -->
    <view v-if="showWeaponPanel" class="weapon-panel-overlay" @click="showWeaponPanel = false">
      <view class="weapon-panel" @click.stop>
        <view class="panel-title">选择武器</view>
        <view class="weapon-list">
          <view
            v-for="weapon in gameStore.weapons"
            :key="weapon.id"
            :class="['weapon-item', { active: gameStore.currentWeapon === weapon.id }]"
            @click="selectWeapon(weapon.id)"
          >
            <text class="weapon-icon">{{ weapon.icon }}</text>
            <text class="weapon-name">{{ weapon.name }}</text>
            <text class="weapon-multiplier">×{{ weapon.damageMultiplier }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 设置弹窗 -->
    <view v-if="showSettings" class="settings-overlay" @click="showSettings = false">
      <view class="settings-panel" @click.stop>
        <view class="panel-title">设置</view>
        <view class="setting-item">
          <text>音效</text>
          <switch :checked="!gameStore.isMuted" @change="toggleMute" />
        </view>
        <view class="setting-item">
          <text>震动</text>
          <switch :checked="gameStore.isVibrationEnabled" @change="toggleVibration" />
        </view>
        <button class="reset-btn" @click="resetGame">重置游戏</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useGameStore } from '@/store/game';
import BagSprite from '@/components/BagSprite.vue';
import HitText from '@/components/HitText.vue';
import AudioManager from '@/utils/AudioManager';

const gameStore = useGameStore();

// UI 状态
const showWeaponPanel = ref(false);
const showSettings = ref(false);
const damageTexts = ref([]);

// 音效管理器
let audioManager = null;

// 怒气槽百分比
const ragePercent = computed(() => {
  return Math.min(100, (gameStore.comboCount / 50) * 100);
});

// 受气包被击打
const onBagHit = () => {
  // 计算伤害
  const { damage, isCritical } = gameStore.hit();

  // 播放音效
  audioManager?.play();

  // 震动反馈
  if (gameStore.isVibrationEnabled) {
    uni.vibrateShort({
      type: 'light'
    });
  }

  // 显示伤害飘字
  addDamageText(damage, isCritical);
};

// 添加伤害飘字
const addDamageText = (damage, isCritical) => {
  const id = Date.now() + Math.random();

  // 获取屏幕信息
  const systemInfo = uni.getSystemInfoSync();
  const centerX = systemInfo.windowWidth / 2;
  const centerY = systemInfo.windowHeight / 2;

  damageTexts.value.push({
    id,
    damage,
    isCritical,
    x: centerX,
    y: centerY - 100
  });

  // 1.2秒后移除（确保动画播放完成）
  setTimeout(() => {
    const index = damageTexts.value.findIndex(t => t.id === id);
    if (index > -1) {
      damageTexts.value.splice(index, 1);
    }
  }, 1200);
};

// 选择武器
const selectWeapon = (weaponId) => {
  gameStore.switchWeapon(weaponId);

  // 重新初始化音效池
  const weapon = gameStore.getCurrentWeapon;
  if (weapon && audioManager) {
    audioManager.destroy();
    audioManager.initPool(weapon.audioSrc);
  }

  showWeaponPanel.value = false;

  uni.showToast({
    title: `已切换至${weapon.name}`,
    icon: 'none'
  });
};

// 切换静音
const toggleMute = (e) => {
  gameStore.toggleMute();
  audioManager?.toggleMute(gameStore.isMuted);
};

// 切换震动
const toggleVibration = () => {
  gameStore.toggleVibration();
};

// 重置游戏
const resetGame = () => {
  uni.showModal({
    title: '确认重置',
    content: '将清除所有分数和连击记录',
    success: (res) => {
      if (res.confirm) {
        gameStore.reset();
        showSettings.value = false;
        uni.showToast({
          title: '已重置',
          icon: 'success'
        });
      }
    }
  });
};

// 换脸功能
const chooseFace = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      gameStore.setCustomFace(res.tempFilePaths[0]);
      uni.showToast({
        title: '换脸成功！',
        icon: 'success'
      });
    }
  });
};

// 排行榜
const showRanking = () => {
  uni.navigateTo({
    url: '/pages/ranking/index'
  });
};

// 监听武器变化，重置连击计时器
let comboTimer = null;
watch(() => gameStore.comboCount, (newVal, oldVal) => {
  if (newVal > oldVal) {
    // 重置计时器
    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
      gameStore.resetCombo();
    }, 3000); // 3秒无点击则重置连击
  }
});

// 页面生命周期
onMounted(() => {
  // 初始化音效管理器
  audioManager = new AudioManager();
  const weapon = gameStore.getCurrentWeapon;
  if (weapon) {
    audioManager.initPool(weapon.audioSrc);
  }
  audioManager.toggleMute(gameStore.isMuted);
});

onUnmounted(() => {
  // 清理资源
  if (audioManager) {
    audioManager.destroy();
  }
  clearTimeout(comboTimer);
});
</script>

<style scoped lang="scss">
.game-page {
  width: 100vw;
  min-height: 100vh;
  background: linear-gradient(180deg, #FFE66D 0%, #FFA502 100%);
  position: relative;
  overflow: hidden;
}

// 顶部栏
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  position: relative;
}

.settings-btn {
  font-size: 48rpx;
  cursor: pointer;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;

  .score-label {
    font-size: 24rpx;
    color: #333;
  }

  .score-value {
    font-size: 56rpx;
    font-weight: bold;
    color: #FF6B6B;
    text-shadow: 2rpx 2rpx 4rpx rgba(0, 0, 0, 0.2);
  }
}

.combo-display {
  position: absolute;
  top: 50%;
  right: 30rpx;
  transform: translateY(-50%);

  .combo-text {
    font-size: 32rpx;
    font-weight: bold;
    color: #FF4757;
    animation: pulse 0.5s ease-in-out infinite;
  }
}

// 怒气槽
.rage-bar {
  width: 90%;
  height: 20rpx;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10rpx;
  overflow: hidden;

  .bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #FFA502 0%, #FF6B6B 100%);
    transition: width 0.3s ease;
  }
}

// 特效层
.hit-text-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 99;
}

// 底部操作栏
.bottom-dock {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  padding: 30rpx;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10rpx);
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.dock-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;

  .btn-icon {
    font-size: 48rpx;
  }

  .btn-label {
    font-size: 24rpx;
    color: #666;
  }
}

// 武器面板
.weapon-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.weapon-panel {
  width: 100%;
  background: #FFF;
  border-radius: 40rpx 40rpx 0 0;
  padding: 40rpx;
  animation: slide-up 0.3s ease-out;
}

.panel-title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
  text-align: center;
}

.weapon-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.weapon-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 30rpx;
  background: #F8F8F8;
  border-radius: 20rpx;
  border: 3rpx solid transparent;

  &.active {
    border-color: #FF6B6B;
    background: #FFF5F5;
  }

  .weapon-icon {
    font-size: 48rpx;
  }

  .weapon-name {
    flex: 1;
    font-size: 32rpx;
    font-weight: bold;
  }

  .weapon-multiplier {
    font-size: 28rpx;
    color: #FF6B6B;
  }
}

// 设置面板
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-panel {
  width: 80%;
  background: #FFF;
  border-radius: 20rpx;
  padding: 40rpx;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #EEE;

  text {
    font-size: 32rpx;
  }
}

.reset-btn {
  margin-top: 30rpx;
  background: #FF6B6B;
  color: #FFF;
  border: none;
  border-radius: 10rpx;
}

// 动画
@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
</style>
