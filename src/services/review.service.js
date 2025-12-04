import ReviewModel from '~/models/Review.model.js'
import ApiError from '~/utils/ApiError.js'
import { StatusCodes } from 'http-status-codes'
import RoomModel from '../models/Room.model'
import { notificationService } from './notification.service.js'

const createReview = async (roomId, reviewData, userId) => {
  try {
    const room = await RoomModel.findById(roomId)
    if (!room) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy phòng.')
    }
    if (room.status !== 'approved') {
      throw new ApiError(StatusCodes.FORBIDDEN, 'không có phòng này!')
    }

    const existingReview = await ReviewModel.findOne({
      roomId,
      userId
    })

    if (existingReview) {
      throw new ApiError(StatusCodes.CONFLICT, 'Bạn đã đánh giá phòng này rồi.')
    }

    const newReview = await ReviewModel.create({
      ...reviewData,
      roomId,
      userId: userId
    })
    await newReview.updateRoomAvgRating()
    const populatedReview = await ReviewModel.findById(newReview._id)
      .populate('userId', 'firstName lastName name avatar email')
      .select('comment rating createdAt userId')
    
    // Tạo thông báo cho host về đánh giá mới
    await notificationService.createNew({
      userId: room.hostId, // người sở hữu phòng
      title: 'Bạn có một đánh giá mới',
      content: `Người dùng ${populatedReview.userId.firstName} đã đánh giá phòng của bạn.`,
      type: 'review:new',
      referenceId: newReview._id
    })
    return populatedReview
  } catch (error) {
    throw error
  }
}

const getReviewsByRoomId = async (queryParams) => {
  try {
    const room = await RoomModel.findById(queryParams.roomId)
    if (!room || room.status !== 'approved') {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy phòng.')
    }
    const page = parseInt(queryParams.page, 10) || 1
    const limit = parseInt(queryParams.limit, 10) || 10
    const startIndex = (page - 1) * limit

    const query = { roomId: queryParams.roomId }

    const reviews = await ReviewModel.find({ ...query, _hidden: false, isDeleted: false })
      .populate('userId', 'firstName lastName name avatar') // Lấy thông tin người dùng
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .select('comment rating createdAt') // Chọn các trường cần thiết

    const total = await ReviewModel.countDocuments(query)

    return {
      reviews,
      pagination: {
        total,
        limit,
        currentPage: page,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    throw error
  }
}

const deleteReview = async (reviewId, user) => {
  try {
    const review = await ReviewModel.findById(reviewId)

    if (!review) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy đánh giá.')
    }

    const isAuthor = review.userId.toString() === user.id.toString()
    const isAdmin = user.role === 'admin'

    if (!isAuthor && !isAdmin) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xoá đánh giá này.')
    }

    review.isDeleted = true
    await review.save()
    await review.updateRoomAvgRating()

    // Tạo thông báo cho host về việc đánh giá bị xoá
    const room = await RoomModel.findById(review.roomId)
    if (room) {
      await notificationService.createNew({
        userId: room.hostId,
        title: 'Một đánh giá đã bị xoá',
        content: `Đánh giá từ người dùng ${user.id} trên phòng của bạn đã bị xoá.`,
        type: 'review:deleted',
        referenceId: review._id
      })
    }
    return { success: true, message: 'Đánh giá đã được xoá thành công.' }
  } catch (error) {
    throw error
  }
}

const updateReview = async (reviewId, reviewData, userId) => {
  try {
    const review = await ReviewModel.findById(reviewId)
    if (!review) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy đánh giá.')
    }
    if (review.userId.toString() !== userId.toString()) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền cập nhật đánh giá này.')
    }
    const updatedReview = await ReviewModel.findByIdAndUpdate(
      reviewId,
      { ...reviewData, updatedAt: new Date() },
      { new: true }
    )
    await updatedReview.updateRoomAvgRating()
    return updatedReview
  } catch (error) {
    throw error
  }
}


/**
 * Like / Unlike đánh giá
 */
const likeReview = async (reviewId, userId) => {
  const review = await ReviewModel.findById(reviewId)
  if (!review) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy đánh giá.')
  }

  const alreadyLiked = review.likeBy.includes(userId)

  if (alreadyLiked) {
    review.likeBy = review.likeBy.filter(id => id.toString() !== userId.toString())
  } else {
    review.likeBy.push(userId)

    // Tạo thông báo cho người viết review khi có người thích đánh giá của họ
    if (review.userId.toString() !== userId.toString()) { // tránh tự like
      await notificationService.createNew({
        userId: review.userId, // người viết review
        title: 'Đánh giá của bạn vừa được thích',
        content: `Người dùng ${userId} đã thích đánh giá của bạn.`,
        type: 'review:liked',
        referenceId: review._id
      })
    }
  }

  review.totalLikes = review.likeBy.length

  await review.save()
  return review
}

const reportReview = async (reviewId, userId, reportReason) => {
  try {
    const review = await ReviewModel.findById(reviewId)
    if (!review) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy đánh giá.')
    }

    // Check if the user has already reported this review
    const alreadyReported = review.reports.some(
      (report) => report.userId.toString() === userId.toString()
    )

    if (alreadyReported) {
      throw new ApiError(StatusCodes.CONFLICT, 'Bạn đã báo cáo đánh giá này rồi.')
    }

    review.reports.push({ userId, reason: reportReason })
    await review.save()

    // Tạo thông báo cho admin về đánh giá bị báo cáo
    await notificationService.createNew({
      userId: null, // thông báo chung cho admin
      role: 'admin',
      title: 'Có đánh giá bị báo cáo',
      content: `Người dùng đã báo cáo đánh giá ${reviewId} với lý do: ${reportReason}`,
      type: 'review:reported',
      referenceId: review._id
    })
    return { success: true, message: 'Báo cáo đã được gửi thành công.' }
  } catch (error) {
    throw error
  }
}

export const reviewService = {
  createReview,
  getReviewsByRoomId,
  deleteReview,
  updateReview,
  likeReview,
  reportReview
}