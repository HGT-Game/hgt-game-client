import setting from '@/utils/setting' // 用户设置（具体代码在附录）
import authority from '@/utils/authority' // localStorage用户信息保存（具体代码在附录）
import request from '@/utils/request/doRequest' // 类似axios请求方法封装（代码略）
import {
	redirectLogin
} from '@/utils/router' // 重定向登陆，登陆后返回等逻辑（代码略）
// 并发触发登陆，返回第一次登陆结果
let prevCodeLogin
/**
 * @description: 检查是否有权限获取用户信息，有的话直接可以直接使用wx.getUserInfo
 */
async function validateSetting() {
	const hasSetting = await setting.has('userInfo')
	if (!hasSetting) {
		// 没有权限的话，清空保存用户信息，重定向登陆
		authority.clear()
		redirectLogin()
	}
	return hasSetting || handleError(new Error('没有获取UserInfo权限'))
}
/**
 * @description: 检查sessionKey是否过期，过期的话需要重新wx.login获取code登陆
 */
export function validateSession() {
	return new Promise(resolve => {
		wx.checkSession({
			success() {
				resolve(1)
			},
			fail() {
				resolve(0)
			}
		})
	})
}
/**
 * @description: 通过code登录
 * 用户登陆过：后台可以获取openid或者unionId直接查询到用户信息，实现静默登陆
 * 用户第一次：需要重定向授权页面，点击getUserInfo的按钮授权登陆
 */
export async function codeLogin(force) { // force：是否强制登陆
	// 获取缓存中的用户信息，有id表示已经登陆过
	const cacheUser = authority.get() || {}
	if (!force && cacheUser.id) return cacheUser
	// isValid：后台code换的session_key是否过期，过期的话不可以解处加密字符串中的用户信息，需要重新登陆
	const isValid = await validateSession()
	if (force || !isValid) {
		if (prevCodeLogin) return prevCodeLogin
		prevCodeLogin = new Promise((resolve, reject) => {
			wx.login({
				async success({
					code
				}) {
					try {
						// 将code发送给后台，后台可以获取到openid，session_key等
						const res = await request({
							url: 'https://api.sunanzhi.com/auth/appletLogin',
							method: 'post',
							data: {
								code
							}
						})
						// code获取后台返回的用户信息（登陆过返回完整用户信息，没有登陆过返回token，token用户后台关联当前用户的session_key）
						const {
							user = {}, token
						} = res
						user.token = token
						authority.set(user)
						prevCodeLogin = null
						return resolve(user)
					} catch (e) {
						reject(e)
					}
				},
				fail(e) {
					prevCodeLogin = null
					reject(e)
				}
			})
		})
		return prevCodeLogin
	}
	return cache
}
/**
 * @description: 解密用户信息或者手机号(encrypted_data, iv)
 * encrypted_data, iv：有获取用户信息权限可以通过getUserInfo获取，否则通过授权按钮获取
 */
export async function toDecode({
	encrypted_data,
	iv
}) {
	// 此方法header中默认携带了code登陆返回的token，后台通过token查到session_key，然后解密出用户信息
	const {
		user,
		token
	} = await request({
		url: '/api/client/v1/auth/login',
		method: 'post',
		data: {
			encrypted_data,
			iv
		}
	})
	if (user) {
		user.token = token
		authority.set(user)
		return user
	} else {
		return Promise.reject(new Error('登录decode失败'))
	}
}
/**
 * @description: getUserInfo 获取加密字符串，传给后台解密出用户信息
 */
export function decodeUserInfo() {
	return new Promise(resolve => {
		wx.getUserInfo({
			lang: 'zh_CN',
			async success(res) {
				const {
					encryptedData,
					iv
				} = res
				const user = await toDecode({
					encrypted_data: encryptedData,
					iv
				})
				resolve(user)
			}
		})
	})
}
/**
 * @description: 登陆封装
 */
export async function login() {
	// 通过wx.login获取code发给后台
	const user = await codeLogin()
	// 返回id表示静默登陆成功
	if (user.id) {
		return user
	}
	// 判断是否有获取用户信息权限，没有的重定向登陆
	await validateSetting()
	// 有getUserInfo权限才会走下边代码，不需要授权直接使用getUserInfo登陆
	return decodeUserInfo()
}
/**
 * @description: 强制登录
 */
export async function loginForce() {
	authority.clear()
	await login()
}
