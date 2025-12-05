<template>
  <view
    v-if="visible"
    class="hit-text"
    :class="{ 'critical': isCritical }"
    :style="{
      left: positionX + 'px',
      top: positionY + 'px',
      color: textColor
    }"
  >
    <text class="damage-value">{{ damageText }}</text>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  damage: {
    type: Number,
    required: true
  },
  isCritical: {
    type: Boolean,
    default: false
  },
  x: {
    type: Number,
    default: 0
  },
  y: {
    type: Number,
    default: 0
  }
});

const visible = ref(true);
const positionX = ref(props.x);
const positionY = ref(props.y);

const damageText = computed(() => {
  return props.isCritical ? `暴击 ${props.damage}!` : `-${props.damage}`;
});

const textColor = computed(() => {
  return props.isCritical ? '#FF4757' : '#FFA502';
});

// 飘字动画
onMounted(() => {
  // 随机偏移
  const randomOffsetX = (Math.random() - 0.5) * 100;
  positionX.value += randomOffsetX;

  // 1秒后消失
  setTimeout(() => {
    visible.value = false;
  }, 1000);
});
</script>

<style scoped lang="scss">
.hit-text {
  position: absolute;
  font-size: 48rpx;
  font-weight: bold;
  pointer-events: none;
  z-index: 100;
  animation: float-up 1s ease-out forwards;
  text-shadow: 2rpx 2rpx 4rpx rgba(0, 0, 0, 0.3);

  &.critical {
    font-size: 64rpx;
    animation: float-up-critical 1s ease-out forwards;
  }
}

.damage-value {
  display: inline-block;
  transform-origin: center;
  animation: scale-bounce 0.3s ease-out;
}

@keyframes float-up {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-150rpx) scale(0.8);
  }
}

@keyframes float-up-critical {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1.2);
  }
  50% {
    transform: translateY(-80rpx) scale(1.3);
  }
  100% {
    opacity: 0;
    transform: translateY(-200rpx) scale(0.9);
  }
}

@keyframes scale-bounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
</style>
