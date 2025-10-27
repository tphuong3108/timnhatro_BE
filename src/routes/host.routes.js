import express from 'express'
import { verifyToken, verifyHost } from '~/middlewares/auth.middleware.js'
import { generalValidation } from '~/validations/general.validation.js'
import { hostController } from '~/controllers/host.controller.js'
import { hostValidation } from '~/validations/host.validation.js'
import { roomValidation } from '~/validations/room.validation.js'
import { roomController } from '~/controllers/room.controller.js'



const Router = express.Router()

Router.post('/rooms', verifyToken, verifyHost, roomValidation.createNew, roomController.createNew)
Router.get('/rooms', verifyToken, verifyHost, roomValidation.pagingValidate, roomController.getAllRooms)
Router.get('/rooms/:id', verifyToken, verifyHost, generalValidation.paramIdValidate, roomController.getAdminRoomDetails)
Router.patch('/rooms/:id', verifyToken, verifyHost, generalValidation.paramIdValidate, roomController.updateRoom)
Router.patch('/rooms/:id/availability', verifyToken, verifyHost, generalValidation.paramIdValidate, roomValidation.updateAvailability, roomController.updateAvailability)
Router.put('/rooms/:id/coordinates', verifyToken, verifyHost, roomValidation.updateRoomCoordinates, roomController.updateRoomCoordinates)
Router.delete('/rooms/:id', verifyToken, verifyHost, generalValidation.paramIdValidate, roomController.destroyRoom)

Router.get('/me', verifyToken, verifyHost, hostController.getMe)
Router.get('/stats/overview', verifyToken, verifyHost, hostController.getOverviewStats)
Router.get('/stats/daily', verifyToken, verifyHost, hostController.getDailyStats)
Router.get('/stats/topViewedRooms', verifyToken, verifyHost, hostController.getTopViewedRooms)
Router.get('/reviews', verifyToken, verifyHost, hostValidation.getMyReviews, hostController.getMyReviews)

export const hostRouter = Router