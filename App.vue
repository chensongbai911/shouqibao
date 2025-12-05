<script>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import pinia from '@/store/index';

export default {
  onLaunch() {
    console.log('受气包解压小程序启动');

    // 初始化云开发环境（如需使用）
    // wx.cloud.init({
    //   env: 'your-env-id',
    //   traceUser: true
    // });
  },

  onShow() {
    console.log('App Show');
  },

  onHide() {
    console.log('App Hide');
  }
};
</script>

<style lang="scss">
/* 全局样式 */
@import '@/uni.scss';

page {
  width: 100%;
  height: 100%;
  background-color: #FFE66D;
}

/* 全局字体 */
* {
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
</style>
