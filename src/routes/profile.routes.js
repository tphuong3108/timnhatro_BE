import express from 'express'
import { verifyToken } from '~/middlewares/auth.middleware.js'
import { profileController } from '~/controllers/profile.controller.js'
const Router = express.Router()

Router.get('/', verifyToken, profileController.getProfile)
Router.put('/', verifyToken, profileController.updateProfile)

export const profileRoute = Router