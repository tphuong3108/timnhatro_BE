import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError.js'
import { PHONE_RULE, PHONE_RULE_MESSAGE } from '~/utils/validators'

const register = async (req, res, next) => {
  const registerRule = Joi.object({
    firstName: Joi.string().min(1).max(30).required().messages({
      'string.base': 'first name must be a string',
      'string.empty': 'first name cannot be empty',
      'string.min': 'first name must be at least 1 character long',
      'string.max': 'first name must not exceed 30 characters'
    }),
    lastName: Joi.string().min(1).max(30).required().messages({
      'string.base': 'last name must be a string',
      'string.empty': 'last name cannot be empty',
      'string.min': 'last name must be at least 1 character long',
      'string.max': 'last name must not exceed 30 characters'
    }),
    email: Joi.string().email().required().messages({
      'string.base': 'email must be a string',
      'string.empty': 'email cannot be empty',
      'string.email': 'email must be a valid email address'
    }),
    phone: Joi.string().pattern(PHONE_RULE).required().messages({
      'string.base': 'phone must be a string',
      'string.empty': 'phone cannot be empty',
      'string.pattern.base': PHONE_RULE_MESSAGE
    }),
    password: Joi.string().min(6).required().messages({
      'string.base': 'password must be a string',
      'string.empty': 'password cannot be empty',
      'string.min': 'password must be at least 6 characters long'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'passwords do not match',
      'string.empty': 'confirm password cannot be empty'
    }),
    avatar: Joi.string().uri().optional().messages({
      'string.base': 'avatar must be a string',
      'string.uri': 'avatar must be a valid URL'
    })
  }).unknown(true)

  try {
    const data = req?.body ? req.body : {}
    const validatedData = await registerRule.validateAsync(data, { abortEarly: false })
    req.body = validatedData
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const login = async (req, res, next) => {
  const validationRule = Joi.object({
    email: Joi.string().email().required().messages({
      'string.base': 'email must be a string',
      'string.empty': 'email cannot be empty',
      'string.email': 'email must be a valid email address'
    }),
    password: Joi.string().min(6).required().messages({
      'string.base': 'password must be a string',
      'string.empty': 'password cannot be empty',
      'string.min': 'password must be at least 6 characters long'
    })
  })

  try {
    const data = req?.body ? req.body : {}
    await validationRule.validateAsync(data, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const requestToken = async (req, res, next) => {
  const validationRule = Joi.object({
    refreshToken: Joi.string().required().messages({
      'string.base': 'refresh token must be a string',
      'string.empty': 'refresh token cannot be empty'
    })
  })

  try {
    const data = req?.body ? req.body : {}
    await validationRule.validateAsync(data, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const changePassword = async (req, res, next) => {
  const validationRule = Joi.object({
    currentPassword: Joi.string().min(6).required().messages({
      'string.base': 'current password must be a string',
      'string.empty': 'current password cannot be empty',
      'string.min': 'current password must be at least 6 characters long'
    }),
    newPassword: Joi.string().min(6).required().messages({
      'string.base': 'new password must be a string',
      'string.empty': 'new password cannot be empty',
      'string.min': 'new password must be at least 6 characters long'
    })
  })

  try {
    const data = req?.body ? req.body : {}
    await validationRule.validateAsync(data, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const sendOTP = async (req, res, next) => {
  const sendOTPRule = Joi.object({
    email: Joi.string().email().required().messages({
      'string.base': 'email must be a string',
      'string.empty': 'email cannot be empty',
      'string.email': 'email must be a valid email address'
    })
  })

  try {
    const data = req?.body ? req.body : {}
    const validatedData = await sendOTPRule.validateAsync(data, { abortEarly: false })
    req.body = validatedData
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const verifyOTP = async (req, res, next) => {
  const validationRule = Joi.object({
    email: Joi.string().email().messages({
      'string.base': 'email must be a string',
      'string.empty': 'email cannot be empty',
      'string.email': 'email must be a valid email address'
    }),
    otp: Joi.string().required().length(6).messages({
      'string.base': 'otp must be a string',
      'string.empty': 'otp cannot be empty',
      'string.length': 'otp must be exactly 6 characters long'
    })
  })
  try {
    const data = req?.body ? req.body : {}
    await validationRule.validateAsync(data, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const updateUserProfile = async (req, res, next) => {
  const validationRule = Joi.object({
    firstName: Joi.string().min(1).max(30).optional().messages({
      'string.base': 'first name must be a string',
      'string.empty': 'first name cannot be empty',
      'string.min': 'first name must be at least 1 character long',
      'string.max': 'first name must not exceed 30 characters'
    }),
    lastName: Joi.string().min(1).max(30).optional().messages({
      'string.base': 'last name must be a string',
      'string.empty': 'last name cannot be empty',
      'string.min': 'last name must be at least 1 character long',
      'string.max': 'last name must not exceed 30 characters'
    }),
    email: Joi.string().email().optional().messages({
      'string.base': 'email must be a string',
      'string.empty': 'email cannot be empty',
      'string.email': 'email must be a valid email address'
    }),
    phone: Joi.string().pattern(PHONE_RULE).optional().messages({
      'string.base': 'phone must be a string',
      'string.empty': 'phone cannot be empty',
      'string.pattern.base': PHONE_RULE_MESSAGE
    }),
    avatar: Joi.string().uri().optional().messages({
      'string.base': 'avatar must be a string',
      'string.empty': 'avatar cannot be empty',
      'string.uri': 'avatar must be a valid URL'
    }),
    bio: Joi.string().max(200).optional().messages({
      'string.base': 'bio must be a string',
      'string.empty': 'bio cannot be empty',
      'string.max': 'bio must not exceed 200 characters'
    })
  })
  try {
    const data = req?.body ? req.body : {}
    await validationRule.validateAsync(data, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const resetPassword = async (req, res, next) => {
  const resetPasswordRule = Joi.object({
    email: Joi.string().email().required().messages({
      'string.base': 'email must be a string',
      'string.empty': 'email cannot be empty',
      'string.email': 'email must be a valid email address'
    }),
    otp: Joi.string().required().length(6).messages({
      'string.base': 'otp must be a string',
      'string.empty': 'otp cannot be empty',
      'string.length': 'otp must be exactly 6 characters long'
    }),
    newPassword: Joi.string().min(6).required().messages({
      'string.base': 'new password must be a string',
      'string.empty': 'new password cannot be empty',
      'string.min': 'new password must be at least 6 characters long'
    })
  })
  try {
    const data = req?.body ? req.body : {}
    await resetPasswordRule.validateAsync(data, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const updateUserLocation = async (req, res, next) => {
  const validationRule = Joi.object({
    longitude: Joi.number().required(),
    latitude: Joi.number().required()
  });

  try {
    await validationRule.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message));
  }
};

export const userValidation = {
  register,
  login,
  requestToken,
  resetPassword,
  changePassword,
  sendOTP,
  verifyOTP,
  updateUserProfile,
  updateUserLocation
}