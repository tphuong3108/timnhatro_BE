import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError.js'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'

const getFilteredReviews = async (req, res, next) => {
  const filteredReviewRule = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    order: Joi.string().valid('asc', 'desc').default('desc').optional()
  })

  const queryRule = Joi.object({
    roomId: Joi.string().pattern(OBJECT_ID_RULE).optional().messages({
      'string.base': OBJECT_ID_RULE_MESSAGE,
      'string.empty': OBJECT_ID_RULE_MESSAGE
    }),
    userId: Joi.string().pattern(OBJECT_ID_RULE).optional().messages({
      'string.base': OBJECT_ID_RULE_MESSAGE,
      'string.empty': OBJECT_ID_RULE_MESSAGE
    })
  })
  try {
    const filteredData = req?.query || {}
    const queryData = req?.body || {}
    await filteredReviewRule.validateAsync(filteredData, { abortEarly: false })
    await queryRule.validateAsync(queryData, { abortEarly: false })
    next()
  } catch (error) {
    return next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message))
  }

}

export const adminValidation = {
  getFilteredReviews
}