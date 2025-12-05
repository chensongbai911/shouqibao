<template>
  <view class="ranking-page">
    <!-- 头部 -->
    <view class="header">
      <view class="title">🏆 今日解压榜</view>
      <view class="subtitle">谁是最强解压王？</view>
    </view>

    <!-- 我的排名卡片 -->
    <view class="my-rank-card">
      <view class="card-left">
        <text class="my-rank">我的排名: {{ myRank || '未上榜' }}</text>
        <text class="my-score">得分: {{ myScore }}</text>
      </view>
      <view class="card-right">
        <button class="upload-btn" @click="uploadScore">上传分数</button>
      </view>
    </view>

    <!-- 排行榜列表 -->
    <view class="rank-list">
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>

      <view v-else-if="rankList.length === 0" class="empty">
        <text>暂无排名数据</text>
      </view>

      <view
        v-else
        v-for="(item, index) in rankList"
        :key="item._id"
        :class="['rank-item', { 'top-three': index < 3 }]"
      >
        <view class="rank-number">
          <text v-if="index === 0" class="medal">🥇</text>
          <text v-else-if="index === 1" class="medal">🥈</text>
          <text v-else-if="index === 2" class="medal">🥉</text>
          <text v-else>{{ index + 1 }}</text>
        </view>

        <view class="user-info">
          <image
            :src="item.avatarUrl || '/static/images/default-avatar.png'"
            class="avatar"
          />
          <text class="nickname">{{ item.nickname || '匿名用户' }}</text>
        </view>

        <view class="score-info">
          <text class="score">{{ item.score }}</text>
          <text class="label">分</text>
        </view>
      </view>
    </view>

    <!-- 刷新提示 -->
    <view class="refresh-tip">
      <text>每日 00:00 重置排名</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useGameStore } from '@/store/game';

const gameStore = useGameStore();

// 状态
const loading = ref(true);
const rankList = ref([]);
const myRank = ref(null);
const myScore = ref(0);

// 获取排行榜数据
const fetchRankList = async () => {
  loading.value = true;

  try {
    // 调用云函数获取排行榜
    const res = await uni.cloud.callFunction({
      name: 'getRanking',
      data: {}
    });

    if (res.result.code === 0) {
      rankList.value = res.result.data;

      // 查找我的排名
      const openid = await getOpenId();
      const myIndex = rankList.value.findIndex(item => item._openid === openid);
      if (myIndex !== -1) {
        myRank.value = myIndex + 1;
      }
    }
  } catch (err) {
    console.error('获取排行榜失败:', err);
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

// 上传分数
const uploadScore = async () => {
  if (gameStore.currentScore === 0) {
    uni.showToast({
      title: '先去打受气包再来吧！',
      icon: 'none'
    });
    return;
  }

  uni.showLoading({ title: '上传中...' });

  try {
    const res = await uni.cloud.callFunction({
      name: 'updateRanking',
      data: {
        score: gameStore.currentScore,
        nickname: '玩家', // 可以从用户信息获取
        avatarUrl: ''
      }
    });

    uni.hideLoading();

    if (res.result.code === 0) {
      uni.showToast({
        title: '上传成功！',
        icon: 'success'
      });

      // 刷新排行榜
      fetchRankList();
    }
  } catch (err) {
    uni.hideLoading();
    uni.showToast({
      title: '上传失败',
      icon: 'none'
    });
  }
};

// 获取用户 OpenID（简化版，实际需要调用云函数）
const getOpenId = async () => {
  // TODO: 实际项目中需要调用云函数获取
  return 'mock-openid';
};

onMounted(() => {
  myScore.value = gameStore.currentScore;
  fetchRankList();
});
</script>

<style scoped lang="scss">
.ranking-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFE66D 0%, #FFA502 100%);
  padding: 30rpx;
}

.header {
  text-align: center;
  padding: 40rpx 0;

  .title {
    font-size: 48rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 10rpx;
  }

  .subtitle {
    font-size: 28rpx;
    color: #666;
  }
}

.my-rank-card {
  background: #FFF;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

  .card-left {
    display: flex;
    flex-direction: column;
    gap: 10rpx;

    .my-rank {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }

    .my-score {
      font-size: 28rpx;
      color: #FF6B6B;
    }
  }

  .upload-btn {
    background: #FF6B6B;
    color: #FFF;
    border: none;
    padding: 20rpx 40rpx;
    border-radius: 50rpx;
    font-size: 28rpx;
  }
}

.rank-list {
  background: #FFF;
  border-radius: 20rpx;
  overflow: hidden;
  min-height: 500rpx;
}

.loading, .empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 500rpx;
  color: #999;
  font-size: 28rpx;
}

.rank-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #F0F0F0;

  &.top-three {
    background: linear-gradient(90deg, #FFF9E6 0%, #FFF 100%);
  }

  &:last-child {
    border-bottom: none;
  }
}

.rank-number {
  width: 80rpx;
  text-align: center;
  font-size: 32rpx;
  font-weight: bold;
  color: #666;

  .medal {
    font-size: 48rpx;
  }
}

.user-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 20rpx;

  .avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: #F0F0F0;
  }

  .nickname {
    font-size: 30rpx;
    color: #333;
  }
}

.score-info {
  display: flex;
  align-items: baseline;
  gap: 5rpx;

  .score {
    font-size: 36rpx;
    font-weight: bold;
    color: #FF6B6B;
  }

  .label {
    font-size: 24rpx;
    color: #999;
  }
}

.refresh-tip {
  text-align: center;
  padding: 40rpx 0;
  color: #666;
  font-size: 24rpx;
}
</style>
