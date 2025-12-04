import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError.js'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators.js'

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
        // Review
        'review:new',
        'review:deleted',
        'review:reported',
        'review:banned',
        'review:liked',

        // Room
        'room:reported',
        'room:banned',
        'room:pending_review',
        'room:approved',
        'room:rejected',
        'room:hidden',
        'room:liked',

        // Booking
        'booking:new',
        'booking:created',
        'booking:approved',
        'booking:declined',
        'booking:canceled_by_user',
        'booking:canceled_by_host',
        'booking:completed',

        // Account
        'account:banned',
        'account:self_banned',
        'account:deleted',
        'account:role_upgraded',

        // Payment
        'payment:success',
        'payment:failed',

        // Chat
        'chat:message',
        'chat:new'
      )
      .required()
      .messages({
        'any.only': 'Invalid notification type',
        'any.required': 'type is required'
      }),

    referenceId: Joi.string()
      .pattern(OBJECT_ID_RULE)
      .allow(null)
      .messages({
        'string.pattern.base': OBJECT_ID_RULE_MESSAGE
      }),

    referenceType: Joi.string()
      .valid('booking', 'room', 'review', 'payment', 'user', null)
      .allow(null),

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
