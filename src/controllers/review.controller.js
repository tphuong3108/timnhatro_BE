import { StatusCodes } from 'http-status-codes'
import { reviewService } from '../services/review.service.js'
import { processMediaFields } from '../utils/media.js'

const createReview = async (req, res, next) => {
  try {
    const { roomId } = req.params
    const userId = req.user.id
    const media = await processMediaFields(req, { imageField: 'images' })
    const images = media.images || []
    const newReview = await reviewService.createReview(roomId, {
      ...req.body,
      images
    }, userId)

    res.status(StatusCodes.CREATED).json({ success: true, data: newReview })
  } catch (error) {
    next(error)
  }
}

const getReviewsByRoomId = async (req, res, next) => {
  try {
    const result = await reviewService.getReviewsByRoomId(req.query)
    res.status(StatusCodes.OK).json({
      success: true,
      count: result.reviews.length,
      pagination: result.pagination,
      data: result.reviews
    })
  } catch (error) {
    next(error)
  }
}

const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params
    const user = req.user

    await reviewService.deleteReview(id, user)
    res.status(StatusCodes.OK).json({ success: true, message: 'Đánh giá đã được xoá thành công.' })
  } catch (error) {
    next(error)
  }
}

const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const media = await processMediaFields(req, { imageField: 'images' })
    const images = media.images || []

    const updatedReview = await reviewService.updateReview(id, {
      ...req.body,
      ...(images.length && { images })
    }, userId)
    res.status(StatusCodes.OK).json({ success: true, data: updatedReview })
  } catch (error) {
    next(error)
  }
}

const reportReview = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const { reason } = req.body

    const result = await reviewService.reportReview(id, userId, reason)
    res.status(StatusCodes.OK).json({ success: true, message: result.message })
  } catch (error) {
    next(error)
  }
}

export const reviewController = {
  createReview,
  getReviewsByRoomId,
  deleteReview,
  updateReview,
  reportReview
}
