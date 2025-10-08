import express from 'express'
import { userRoute } from './user.routes.js'
import { profileRoute } from './profile.routes.js'
import { roomRoute } from './room.routes.js'
import { adminRoute } from './admin.routes.js'


const Router = express.Router()

Router.get('/status', (req, res) => {
  res.status(200).json({ message: 'API is running' })
})

Router.use('/admin', adminRoute)
Router.use('/users', userRoute)
Router.use('/me', profileRoute)

Router.use('/rooms', roomRoute)

export const APIs = Router