import express from 'express'
import { amenityRoute } from './amenity.routes.js'

const Router = express.Router()

Router.use('/amenities', amenityRoute)

export const adminRoute = Router