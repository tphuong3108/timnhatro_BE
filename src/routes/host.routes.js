import express from 'express'
import { verifyToken, verifyHost } from '~/middlewares/auth.middleware.js'
import { generalValidation } from '~/validations/general.validation.js'



const Router = express.Router()



export const hostRoute = Router