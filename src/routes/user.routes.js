import express from 'express'

import { generalValidation } from '~/validations/general.validation'
import { userValidation } from '~/validations/user.validation.js'
import { userController } from '~/controllers/user.controller.js'
import { verifyToken, verifyAdmin } from '~/middlewares/auth.middleware.js'
import { userBadgeController } from '~/controllers/userBadge.controller'

import { loginRateLimiter, registerRateLimiter, verifyOtpRateLimiter } from '~/middlewares/limiter.middleware'

const Router = express.Router()

Router.post('/forgot-password', verifyOtpRateLimiter, generalValidation.emailValidation, userController.sendOTP)
Router.post('/reset-password', userValidation.resetPassword, userController.resetPassword)
Router.post('/register', registerRateLimiter, userValidation.register, userController.register)
Router.post('/login', loginRateLimiter, userValidation.login, userController.login)
Router.post('/logout', verifyToken, userController.logout)
Router.post('/request-token', userValidation.requestToken, userController.requestToken)
Router.put('/change-password', verifyToken, userValidation.changePassword, userController.changePassword)
Router.post('/send-otp', verifyOtpRateLimiter, userValidation.sendOTP, userController.sendOTP)
Router.post('/verify-otp', userValidation.verifyOTP, userController.verifyOTP)

Router.get('/profile', verifyToken, userController.getProfile)
// Router.post('/logout', userController.logout)


export const userRoute = Router