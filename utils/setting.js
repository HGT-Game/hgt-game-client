const noop = () => {}
// 并发查询setting返回同一个结果
let preGetSetting
// 需要直接点击，不能在异步函数之中（可以使用wx.showModal的success中使用)
export function openSetting(name, callback = noop) {
	wx.getSetting({
		success({
			authSetting
		}) {
			const key = `scope.${name}`
			let success = false
			if (authSetting[key] === false) {
				wx.show
				wx.openSetting({
					success({
						authSetting: auth
					}) {
						if (callback) {
							success = auth[key] !== false
							callback(success)
						}
					}
				})
			} else {
				// 已经有权限
				if (typeof callback === 'function') {
					callback(success)
				}
			}
		}
	})
}
// 获取用户授权信息
export function getSetting() {
	if (preGetSetting) return preGetSetting
	preGetSetting = new Promise(resolve => {
		wx.getSetting({
			success({
				authSetting
			}) {
				preGetSetting = null
				resolve(authSetting)
			},
			fail(e) {
				preGetSetting = null
				reject(e)
			}
		})
	})
	return preGetSetting
}
async function hasSetting(name) {
	const setting = await getSetting()
	const key = `scope.${name}` // userLocation、userInfo
	return setting[key]
}
export default {
	open: openSetting,
	get: getSetting,
	has: hasSetting
}
