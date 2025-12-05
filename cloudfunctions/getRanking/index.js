// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  try {
    // 获取今日日期（用于每日榜单）
    const today = new Date().toISOString().split('T')[0];

    // 查询今日排行榜，按分数降序排列，取前 100 名
    const result = await db.collection('rankings')
      .where({
        date: today
      })
      .orderBy('score', 'desc')
      .limit(100)
      .get();

    return {
      code: 0,
      message: 'success',
      data: result.data
    };
  } catch (err) {
    console.error('获取排行榜失败:', err);
    return {
      code: -1,
      message: err.message,
      data: []
    };
  }
};
