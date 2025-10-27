import express from 'express'
import { verifyToken, verifyAdmin } from '~/middlewares/auth.middleware.js'
import { generalValidation } from '~/validations/general.validation.js'

import { adminValidation } from '~/validations/admin.validation'
import { adminController } from '~/controllers/admin.controller.js'

import { userValidation } from '~/validations/user.validation.js'
import { userController } from '~/controllers/user.controller.js'

import { roomValidation } from '~/validations/room.validation.js'
import { roomController } from '~/controllers/room.controller.js'

const Router = express.Router()

Router.get('/me', verifyToken, verifyAdmin, adminController.getMe);
Router.post('/login', userValidation.login, userController.login)

Router.get('/users', verifyToken, verifyAdmin, userController.getAllUsers)
Router.get('/users/:id', verifyToken, verifyAdmin, generalValidation.paramIdValidate, userController.getUserDetails)
Router.put('/users/:id', verifyToken, verifyAdmin, generalValidation.paramIdValidate, userController.banUser)
Router.delete('/users/:id', verifyToken, verifyAdmin, generalValidation.paramIdValidate, userController.destroyUser)

Router.get('/stats/overview', verifyToken, verifyAdmin, adminController.getOverviewStats)
Router.get('/stats/daily', verifyToken, verifyAdmin, adminController.getDailyStats)
Router.get('/stats/popular', verifyToken, verifyAdmin, adminController.getPopularStats)
Router.get('/stats/topViewedRooms', verifyToken, verifyAdmin, adminController.getTopViewedRooms)
Router.get('/stats/logins', verifyToken, verifyAdmin, adminController.getLoginStats)
Router.get('/stats/monthlyUsers', verifyToken, verifyAdmin, adminController.getUserMonthlyStats)
Router.get('/stats/topHosts', verifyToken, verifyAdmin, adminController.getTopHosts)
Router.get('/stats/reports', verifyToken, verifyAdmin, adminController.getReportStats)
Router.post('/stats/processReports', verifyToken, verifyAdmin, adminController.processReports)

Router.post('/rooms', verifyToken, verifyAdmin, roomValidation.createNew, roomController.createNew)
Router.get('/rooms', verifyToken, verifyAdmin, roomValidation.pagingValidate, roomController.getAllRoomsForAdmin)
Router.get('/rooms/:id', verifyToken, verifyAdmin, generalValidation.paramIdValidate, roomController.getAdminRoomDetails)
Router.patch('/rooms/:id', verifyToken, verifyAdmin, generalValidation.paramIdValidate, roomController.updateRoom)
Router.patch('/rooms/:id/approve', verifyToken, verifyAdmin, generalValidation.paramIdValidate, roomController.approveRoom)
Router.patch('/rooms/:id/coordinates', verifyToken, verifyAdmin, roomValidation.updateRoomCoordinates, roomController.updateRoomCoordinates)
Router.delete('/rooms/:id', verifyToken, verifyAdmin, generalValidation.paramIdValidate, roomController.destroyRoom)

Router.get('/reviews', verifyToken, verifyAdmin, adminValidation.getFilteredReviews, adminController.getFilteredReviews)
Router.delete('/reviews/:id', verifyToken, verifyAdmin, generalValidation.paramIdValidate, adminController.deleteReview)
Router.put('/reviews/:id', verifyToken, verifyAdmin, generalValidation.paramIdValidate, adminController.hideReview)

export const adminRoute = Router