import express from 'express'
import { reviewController } from '../controllers/review.controller.js'
import { reviewValidation } from '../validations/review.validation.js'
import { verifyToken,  verifyRoles, verifyTenant} from '../middlewares/auth.middleware.js'
import { reviewRateLimiter } from '../middlewares/limiter.middleware.js'
import upload from '~/middlewares/cloudinary.middleware.js'

const router = express.Router()

// Lấy danh sách đánh giá cho một địa điểm
router.get('/', reviewValidation.getReviewsByRoomId, reviewController.getReviewsByRoomId)

// Viết đánh giá cho một địa điểm (yêu cầu đăng nhập)
router.post('/:roomId', reviewRateLimiter, upload.array('images'), verifyToken, verifyTenant, reviewValidation.createReview, reviewController.createReview)

// Cập nhật đánh giá (yêu cầu đăng nhập)
router.patch('/:id', verifyToken, verifyTenant, upload.array('images'), reviewValidation.updateReview, reviewController.updateReview)

// Xoá một đánh giá (yêu cầu đăng nhập) //cần đổi thành xóa mềm
router.delete('/:id', verifyToken, verifyRoles('tenant','admin'), reviewValidation.deleteReview, reviewController.deleteReview)

// Báo cáo một đánh giá (yêu cầu đăng nhập)
router.post('/:id/report', verifyToken, verifyRoles('tenant','host'), reviewValidation.reportReview, reviewController.reportReview)

export const reviewRouter = router