import express from 'express'
import passport from 'passport'
import { generalValidation } from '~/validations/general.validation'
import { userValidation } from '~/validations/user.validation.js'
import { userController } from '~/controllers/user.controller.js'
import { verifyToken } from '~/middlewares/auth.middleware.js'
import { loginRateLimiter, registerRateLimiter, verifyOtpRateLimiter } from '~/middlewares/limiter.middleware'

const Router = express.Router()

// --- Authentication & Authorization ---
Router.post('/register', registerRateLimiter, userValidation.register, userController.register)
Router.post('/login', loginRateLimiter, userValidation.login, userController.login)
Router.post('/logout', verifyToken, userController.logout)
Router.post('/request-token', userValidation.requestToken, userController.requestToken)
Router.post('/verify-email', userValidation.verifyOTP, userController.verifyEmail)

// --- Password Management ---
Router.post('/forgot-password', verifyOtpRateLimiter, generalValidation.emailValidation, userController.sendPasswordResetOTP) //quên mật khẩu - gửi mã OTP
Router.post('/reset-password', userValidation.resetPassword, userController.resetPassword) //đặt lại mật khẩu
Router.put('/change-password', verifyToken, userValidation.changePassword, userController.changePassword) //đổi mật khẩu

// Route for Facebook login
Router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'], session: false }))
Router.get(
  '/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login', session: false }),
  userController.oAuthLoginCallback
)
// Google login
Router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }))
Router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  userController.oAuthLoginCallback
)

// --- User Profile & Content ---
Router.get('/profile', verifyToken, userController.getProfile)
Router.put('/location', verifyToken, userValidation.updateUserLocation, userController.updateUserLocation)
Router.put('/me/ban', verifyToken, userController.banSelf)

// This parameterized route must be last to avoid overriding other specific GET routes.
Router.get('/:id', userController.getUserDetails)
export const userRoute = Router
