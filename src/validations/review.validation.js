import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError.js'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators.js'

const roomIdRule = Joi.object({
  roomId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
})

const idRule = Joi.object({
  id: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
})

const createReview = async (req, res, next) => {
  const createReviewRule = Joi.object({
    rating: Joi.number().required().min(1).max(5).messages({
      'number.base': 'rating phải là một con số',
      'number.min': 'rating phải từ 1 đến 5 sao',
      'number.max': 'rating phải từ 1 đến 5 sao',
      'any.required': 'rating là trường bắt buộc'
    }),
    comment: Joi.string().required().min(3).trim().messages({
      'string.empty': 'comment không được để trống',
      'string.min': 'comment phải có ít nhất 3 ký tự',
      'any.required': 'comment là trường bắt buộc'
    }),
    images: Joi.array().items(Joi.string()).optional().default([]),
  })

  try {
    // Nếu có file upload thì copy path vào req.body.images để Joi không báo lỗi
    if (req.files?.images?.length) {
      req.body.images = req.files.images.map(f => f.path || f.secure_url || f.location || '')
    }

    // Parse JSON string nếu client gửi multipart/form-data
    if (typeof req.body.images === 'string') {
      try { req.body.images = JSON.parse(req.body.images) } catch {}
    }

    const roomIdData = req?.params || {}
    const data = req?.body || {}

    await roomIdRule.validateAsync(roomIdData, { abortEarly: false })
    await createReviewRule.validateAsync(data, { abortEarly: false })

    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const deleteReview = async (req, res, next) => {
  try {
    const reviewIdData = req?.params || {}
    await idRule.validateAsync(reviewIdData, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const getReviewsByRoomId = async (req, res, next) => {
  const pagingRule = Joi.object({
    roomId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })
  try {
    const data = req?.query || {}
    await pagingRule.validateAsync(data, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const updateReview = async (req, res, next) => {
  const updateReviewRule = Joi.object({
    rating: Joi.number().optional().min(1).max(5).messages({
      'number.base': 'rating phải là một con số',
      'number.min': 'rating phải từ 1 đến 5 sao',
      'number.max': 'rating phải từ 1 đến 5 sao'
    }),
    comment: Joi.string().optional().min(3).trim().messages({
      'string.empty': 'comment không được để trống',
      'string.min': 'comment phải có ít nhất 3 ký tự'
    }),
    images: Joi.array().items(Joi.string()).optional().default([]),
  })
  try {
    // Nếu có file upload thì copy path vào req.body.images để Joi không báo lỗi
    if (req.files?.images?.length) {
      req.body.images = req.files.images.map(f => f.path || f.secure_url || f.location || '')
    }

    // Parse JSON string nếu client gửi multipart/form-data
    if (typeof req.body.images === 'string') {
      try { req.body.images = JSON.parse(req.body.images) } catch {}
    }

    const reviewIdData = req?.params || {}
    const data = req?.body || {}

    await idRule.validateAsync(reviewIdData, { abortEarly: false })
    await updateReviewRule.validateAsync(data, { abortEarly: false })

    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const reportReview = async (req, res, next) => {
  const reportReviewRule = Joi.object({
    reason: Joi.string().required().min(10).trim().messages({
      'string.empty': 'Lý do báo cáo không được để trống.',
      'string.min': 'Lý do báo cáo phải có ít nhất 10 ký tự.',
      'any.required': 'Lý do báo cáo là trường bắt buộc.',
    }),
  })

  try {
    const reviewIdData = req?.params || {}
    const data = req?.body || {}
    await idRule.validateAsync(reviewIdData, { abortEarly: false })
    await reportReviewRule.validateAsync(data, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

export const reviewValidation = {
  createReview,
  deleteReview,
  getReviewsByRoomId,
  updateReview,
  reportReview
}