import express from 'express'
import { verifyToken, verifyRoles, verifyAdmin, verifyHost } from '~/middlewares/auth.middleware.js'
import { roomValidation } from '~/validations/room.validation.js'
import { roomController } from '~/controllers/room.controller.js'
import { generalValidation } from '~/validations/general.validation.js'

const Router = express.Router()

// Tìm kiếm phòng
Router.get('/search', roomValidation.searchValidate, roomController.searchRooms)

// Lấy phòng gần đây
Router.get('/nearby', roomValidation.nearbyRooms, roomController.getNearbyRooms)

// Đề xuất / tạo phòng mới
Router.post('/suggest', verifyToken, verifyRoles('host','admin'), roomValidation.createNew, roomController.createNew)

// Lấy danh sách phòng
Router.get('/', roomValidation.pagingValidate, roomController.getAllRooms)

// Lấy dữ liệu phòng cho bản đồ
Router.get('/map-data', roomValidation.pagingValidate, roomController.getRoomsMapdata)

// Phòng nổi bật
Router.get('/hot', roomController.getHotRooms)

// Chi tiết phòng
Router.get('/:id', generalValidation.paramSlugValidate, roomController.getRoomDetails)

// Like phòng
Router.patch('/:id', verifyToken, verifyRoles('tenant', 'host'), generalValidation.paramIdValidate, roomController.likeRoom)

// Thêm / xóa phòng khỏi yêu thích
Router.post('/:id/favorite', verifyToken, verifyRoles('tenant', 'host'), generalValidation.paramIdValidate, roomController.addToFavorites)
Router.delete('/:id/favorite', verifyToken, verifyRoles('tenant', 'host'), generalValidation.paramIdValidate, roomController.removeFromFavorites)

export const roomRoute = Router
