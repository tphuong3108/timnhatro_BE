import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError.js'

/**
 * Validate tạo thông báo
 */
const createNotificationValidate = async (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.string()
      .allow(null)
      .messages({
        'string.base': 'userId must be a string or null'
      }),

    role: Joi.string()
      .valid('tenant', 'host', 'admin')
      .required()
      .messages({
        'any.only': 'role must be tenant, host or admin',
        'any.required': 'role is required'
      }),

    type: Joi.string()
      .valid(
        'booking', // Đặt phòng
        'payment', // Thanh toán
        'review',  // Đánh giá
        'report'   // Báo cáo
      )
      .required()
      .messages({
        'any.only': 'Invalid notification type',
        'any.required': 'type is required'
      }),

    title: Joi.string()
      .min(3)
      .max(255)
      .required()
      .messages({
        'string.min': 'Title must be at least 3 characters',
        'string.max': 'Title must be less than 255 characters',
        'any.required': 'Title is required'
      }),

    message: Joi.string()
      .min(3)
      .max(1000)
      .required()
      .messages({
        'string.min': 'Message must be at least 3 characters',
        'string.max': 'Message must be less than 1000 characters',
        'any.required': 'Message is required'
      }),

    metadata: Joi.object().optional() // chứa id booking, id phòng...
  })

  try {
    await schema.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    const details = error.details.map((err) => err.message)
    next(new ApiError(StatusCodes.BAD_REQUEST, details.join(', ')))
  }
}

export const notificationValidation = {
  createNotificationValidate
}
