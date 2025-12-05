// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { score, nickname, avatarUrl } = event;

  try {
    // 获取今日日期
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // 查询用户今日是否已有记录
    const existingRecord = await db.collection('rankings')
      .where({
        _openid: wxContext.OPENID,
        date: today
      })
      .get();

    if (existingRecord.data.length > 0) {
      // 如果已有记录，只更新更高的分数
      const currentRecord = existingRecord.data[0];
      if (score > currentRecord.score) {
        await db.collection('rankings').doc(currentRecord._id).update({
          data: {
            score: score,
            nickname: nickname || currentRecord.nickname,
            avatarUrl: avatarUrl || currentRecord.avatarUrl,
            updateTime: now
          }
        });

        return {
          code: 0,
          message: '刷新最高分成功！',
          data: { updated: true }
        };
      } else {
        return {
          code: 1,
          message: '分数未超过历史最高分',
          data: { updated: false }
        };
      }
    } else {
      // 新增记录
      await db.collection('rankings').add({
        data: {
          score: score,
          nickname: nickname || '匿名玩家',
          avatarUrl: avatarUrl || '',
          date: today,
          createTime: now,
          updateTime: now
        }
      });

      return {
        code: 0,
        message: '上传成功！',
        data: { updated: true }
      };
    }
  } catch (err) {
    console.error('更新排行榜失败:', err);
    return {
      code: -1,
      message: err.message,
      data: null
    };
  }
};
