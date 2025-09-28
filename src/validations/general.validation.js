import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError.js'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators.js'

const paramSlugValidate = async (req, res, next) => {
  const slugRule = Joi.object({
    id: Joi.string().trim().min(1).max(100).required().messages({
      'string.base': 'id must be a string',
      'string.empty': 'id must not be empty',
      'string.min': 'id must be at least 1 character long',
      'string.max': 'id must be at most 100 characters long'
    })
  })
  try {
    const data = req?.params ? req.params : {}
    await slugRule.validateAsync(data, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const paramIdValidate = async (req, res, next) => {
  const idRule = Joi.object({
    id: Joi.string().pattern(OBJECT_ID_RULE).required().messages({
      'string.base': 'ID must be a string',
      'string.pattern.base': OBJECT_ID_RULE_MESSAGE
    })
  })
  try {
    const data = req?.params ? req.params : {}
    await idRule.validateAsync(data, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const queryUserIdValidate = async (req, res, next) => {
  const queryRule = Joi.object({
    userId: Joi.string().pattern(OBJECT_ID_RULE).required().messages({
      'string.base': 'User ID must be a string',
      'string.pattern.base': OBJECT_ID_RULE_MESSAGE
    })
  })
  try {
    const data = req?.query ? req.query : {}
    await queryRule.validateAsync(data, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const pagingValidate = async (req, res, next) => {
  const pagingRule = Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
    limit: Joi.number().integer().min(1).max(100).default(10).messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100'
    })
  })
  try {
    const data = req?.query ? req.query : {}
    await pagingRule.validateAsync(data, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const emailValidation = async (req, res, next) => {
  const emailRule = Joi.object({
    email: Joi.string().email().required().messages({
      'string.base': 'Email must be a string',
      'string.email': 'Email must be a valid email address',
      'string.empty': 'Email must not be empty'
    })
  })
  try {
    const data = req?.body ? req.body : {}
    await emailRule.validateAsync(data, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

export const generalValidation = {
  paramIdValidate,
  queryUserIdValidate,
  paramSlugValidate,
  emailValidation,
  pagingValidate
}
