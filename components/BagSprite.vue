<template>
  <view class="bag-sprite" @click="onHit">
    <view
      :class="['bag-container', bagState, { 'is-hit': isHitting }]"
      :style="{ transform: `scale(${scale})` }"
    >
      <!-- 受气包脸部 -->
      <image
        v-if="customFaceUrl"
        :src="customFaceUrl"
        class="bag-face custom"
        mode="aspectFill"
      />
      <view v-else class="bag-face default" :class="expressionClass">
        <view class="eyes">
          <view class="eye left">{{ eyeExpression }}</view>
          <view class="eye right">{{ eyeExpression }}</view>
        </view>
        <view class="mouth">{{ mouthExpression }}</view>
      </view>

      <!-- 吐槽气泡 -->
      <view v-if="showBubble" class="speech-bubble">
        {{ bubbleText }}
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useGameStore } from '@/store/game';

const gameStore = useGameStore();

// 组件状态
const bagState = ref('idle'); // idle | hit | dizzy
const isHitting = ref(false);
const scale = ref(1);
const showBubble = ref(false);
const bubbleText = ref('');

let resetTimer = null;
let bubbleTimer = null;

// 自定义头像
const customFaceUrl = computed(() => gameStore.customFaceUrl);

// 表情计算
const expressionClass = computed(() => {
  if (gameStore.comboCount > 50) return 'dizzy';
  if (gameStore.comboCount > 20) return 'hurt';
  return 'normal';
});

const eyeExpression = computed(() => {
  if (gameStore.comboCount > 50) return 'X';
  if (gameStore.comboCount > 20) return 'T';
  return '>';
});

const mouthExpression = computed(() => {
  if (gameStore.comboCount > 50) return '~~~~~';
  if (gameStore.comboCount > 20) return '︿';
  return '◡';
});

// 挑衅文案库
const taunts = [
  '就这点力气？',
  '不痛不痒~',
  '再用力点啊！',
  '你行不行啊',
  '哈哈哈哈',
  '轻了轻了',
  '像挠痒痒'
];

// 点击处理
const onHit = () => {
  // 状态变化
  bagState.value = 'hit';
  isHitting.value = true;
  scale.value = 0.9;

  // 触发父组件事件
  emit('hit');

  // 动画结束恢复
  setTimeout(() => {
    isHitting.value = false;
    scale.value = 1;
  }, 100);

  // 防抖：2秒无点击后显示挑衅气泡
  clearTimeout(resetTimer);
  clearTimeout(bubbleTimer);

  resetTimer = setTimeout(() => {
    bagState.value = 'idle';
    showBubble.value = true;
    bubbleText.value = taunts[Math.floor(Math.random() * taunts.length)];

    bubbleTimer = setTimeout(() => {
      showBubble.value = false;
    }, 2000);
  }, 2000);
};

const emit = defineEmits(['hit']);
</script>

<style scoped lang="scss">
.bag-sprite {
  width: 100%;
  height: 60vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.bag-container {
  width: 300rpx;
  height: 300rpx;
  position: relative;
  transition: transform 0.05s ease-out;

  // 待机浮动动画
  &.idle {
    animation: float 2s ease-in-out infinite;
  }

  // 被击打抖动
  &.is-hit {
    animation: shake 0.1s ease-in-out;
  }
}

.bag-face {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  &.default {
    background: linear-gradient(135deg, #FFD93D 0%, #FFAA33 100%);
    border: 8rpx solid #FF6B6B;
    box-shadow: 0 10rpx 30rpx rgba(255, 107, 107, 0.3);
  }

  &.custom {
    border: 8rpx solid #FF6B6B;
    box-shadow: 0 10rpx 30rpx rgba(255, 107, 107, 0.3);
  }
}

.eyes {
  display: flex;
  gap: 60rpx;
  margin-bottom: 20rpx;
}

.eye {
  font-size: 50rpx;
  font-weight: bold;
  color: #333;

  &.normal { content: '>'; }
  &.hurt { content: 'T'; }
  &.dizzy { content: 'X'; }
}

.mouth {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-top: 10rpx;
}

.speech-bubble {
  position: absolute;
  top: -80rpx;
  left: 50%;
  transform: translateX(-50%);
  background: #FFF;
  padding: 20rpx 30rpx;
  border-radius: 20rpx;
  border: 4rpx solid #FF6B6B;
  font-size: 28rpx;
  color: #333;
  white-space: nowrap;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  animation: bubble-appear 0.3s ease-out;

  &::after {
    content: '';
    position: absolute;
    bottom: -20rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 15rpx solid transparent;
    border-right: 15rpx solid transparent;
    border-top: 20rpx solid #FFF;
  }
}

// 动画定义
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20rpx); }
}

@keyframes shake {
  0% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(-10rpx, 10rpx) rotate(-5deg); }
  50% { transform: translate(10rpx, -10rpx) rotate(5deg); }
  75% { transform: translate(-10rpx, 5rpx) rotate(-3deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}

@keyframes bubble-appear {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(10rpx);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
