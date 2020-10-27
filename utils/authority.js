// 储存前缀
const key = 'prefix_key'
// 储存有效时间
const maxAge = 1000 * 60 * 60 * 24 * 60
export default {
	get() {
		try {
			const user = wx.getStorageSync(key)
			if (!user || user.time + maxAge < new Date().getTime()) return {}
			return user || {}
		} catch (e) {
			return {}
		}
	},
	set(user) {
		if (!user) return null
		user.time = new Date().getTime()
		const oldUser = this.get() || {}
		const newUser = { ...oldUser,
			...user
		}
		wx.setStorageSync(key, newUser)
		return newUser
	},
	clear() {
		const user = this.get() || {}
		wx.clearStorageSync()
		wx.removeStorageSync(key)
		this.set({
			user: {}
		})
		return user
	}
}
