/**
 * http用于将wx.request改写成Promise方式
 * @param：{string} httpUrl 接口地址
 * @return: Promise实例对象
 */
const http = httpUrl => {
  // 返回一个Promise实例对象
  return new Promise((resolve, reject) => {
    wx.request({
      url: httpUrl,
      success: res => resolve(res)
    })
  })
}
// 我把这个函数放在了utils.js中，这样在需要时可以直接引入
module.exports = http