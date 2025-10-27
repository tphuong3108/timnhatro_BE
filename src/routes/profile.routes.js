import express from 'express'
import { verifyToken, verifyTenant } from '~/middlewares/auth.middleware.js'
import { profileController } from '~/controllers/profile.controller.js'
const Router = express.Router()

Router.get('/', verifyToken, profileController.getMyProfile) // Lấy profile của chính mình
Router.get('/:id', profileController.getPublicProfile) // Lấy profile công khai của user khác bằng ID
Router.patch('/', verifyToken, profileController.updateProfile)

Router.get('/reviews', verifyToken, profileController.getUserReviews)
Router.patch('/upgrade-role', verifyToken, verifyTenant, profileController.upgradeToHost)

export const profileRoute = Router