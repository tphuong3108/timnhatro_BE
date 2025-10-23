import express from 'express'
import { userRoute } from './user.routes.js'
import { profileRoute } from './profile.routes.js'
import { roomRoute } from './room.routes.js'
import { adminRoute } from './admin.routes.js'
// import { hostRouter } from './host.routes.js'
import { wardRoute } from './ward.routes.js'
import { amenityRoute } from './amenity.routes.js'
import { reviewRouter } from './review.routes.js'

const Router = express.Router()

Router.get('/status', (req, res) => {
  res.status(200).json({ message: 'API is running' })
})

Router.use('/admin', adminRoute)
// Router.use('/hosts', hostRouter)
Router.use('/users', userRoute)
Router.use('/me', profileRoute)

Router.use('/rooms', roomRoute)
Router.use('/wards', wardRoute)
Router.use('/reviews', reviewRouter)
Router.use('/amenities', amenityRoute)

export const APIs = Router