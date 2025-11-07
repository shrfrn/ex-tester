import Cryptr from 'cryptr'
import bcrypt from 'bcrypt'

import { userService } from '../user/user.service.js'
import { logger } from '../../services/logger.service.js'

const cryptr = new Cryptr(process.env.SECRET || 'Secret-Puk-1234')

export const authService = {
	signup,
	login,
	getLoginToken,
	validateToken,
}

async function signup({ username, password, fullname, phone }) {
	const saltRounds = 10

	logger.info(`auth.service - signup with username: ${username}, fullname: ${fullname}`)
	if (!username || !password || !fullname || !phone) return Promise.reject('Missing required signup information')

	const userExist = await userService.getByUsername(username)
	if (userExist) return Promise.reject('Username already taken')

	const hash = await bcrypt.hash(password, saltRounds)
	return userService.add({ username, password: hash, fullname, phone })
}

async function login(username, password) {
	logger.info(`auth.service - login with username: ${username}`)

	const user = await userService.getByUsername(username)
	if (!user) return Promise.reject('Invalid username or password')

	const match = await bcrypt.compare(password, user.password)
	if (!match) return Promise.reject('Invalid username or password')

	delete user.password
	user._id = user._id.toString()
	return user
}

function getLoginToken(user) {
	const userInfo = { 
        _id: user._id, 
        username: user.username,
        fullname: user.fullname, 
        loggedinAt: Date.now(),
    }
	return cryptr.encrypt(JSON.stringify(userInfo))
}

function validateToken(loginToken) {
	try {
		const json = cryptr.decrypt(loginToken)
		const loggedinUser = JSON.parse(json)
		return loggedinUser
	} catch (err) {
		console.log('Invalid login token')
	}
	return null
}