// 云函数入口文件
// cloudfunctions/login/index.js

const cloud = require('wx-server-sdk');

// 初始化 cloud
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

/**
 * 云函数：获取用户OpenID
 * 用于用户认证和身份识别
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  console.log('获取用户信息:');
  console.log('  openid:', wxContext.OPENID);
  console.log('  appid:', wxContext.APPID);
  console.log('  unionid:', wxContext.UNIONID);

  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
    event: event
  };
};
