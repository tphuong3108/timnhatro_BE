import express from 'express'
import { verifyToken } from '~/middlewares/auth.middleware.js'
import { profileController } from '~/controllers/profile.controller.js'
const Router = express.Router()

Router.get('/', verifyToken, profileController.getProfile)
Router.patch('/', verifyToken, profileController.updateProfile)

Router.get('/reviews', verifyToken, profileController.getUserReviews)

export const profileRoute = Router