import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError.js'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators.js'

const idRule = Joi.object({
  id: Joi.string().pattern(OBJECT_ID_RULE).required().messages({
    'string.base': 'ID must be a string',
    'string.pattern.base': OBJECT_ID_RULE_MESSAGE
  })
})

const createNew = async (req, res, next) => {
  const validationRule = Joi.object({
    name: Joi.string().min(3).max(100).required().messages({
      'string.base': 'name must be a string',
      'string.empty': 'name cannot be empty',
      'string.min': 'name must be at least 3 characters long',
      'string.max': 'name must be at most 100 characters long'
    }),
    description: Joi.string().min(10).max(500).required().messages({
      'string.base': 'description must be a string',
      'string.empty': 'description cannot be empty',
      'string.min': 'description must be at least 10 characters long',
      'string.max': 'description must be at most 500 characters long'
    }),
    price: Joi.number().min(0).required().messages({
      'number.base': 'price must be a number',
      'number.min': 'price must be at least 0',
      // 'any.required': 'price is required'
    }),
    amenities: Joi.array().items(
      Joi.string().pattern(OBJECT_ID_RULE).required().messages({
        'string.base': 'amenities must be a string',
        'string.empty': 'amenities cannot be empty',
        'string.pattern.base': OBJECT_ID_RULE_MESSAGE
      })
    ).required().messages({
      'array.base': 'amenities must be an array',
      'array.items': 'amenities must contain valid ObjectId strings'
    }),
    address: Joi.string().min(5).max(200).required().messages({
      'string.base': 'address must be a string',
      'string.empty': 'address cannot be empty',
      'string.min': 'address must be at least 5 characters long',
      'string.max': 'address must be at most 200 characters long'
    }),
    ward: Joi.string().pattern(OBJECT_ID_RULE).required().messages({
      'string.base': 'ward must be a string',
      'string.empty': 'ward cannot be empty',
      'string.pattern.base': OBJECT_ID_RULE_MESSAGE
    }),
    location: Joi.object({
      type: Joi.string().valid('Point').default('Point'),
      coordinates: Joi.array().ordered(
        Joi.number().min(-180).max(180).required(), // longitude
        Joi.number().min(-90).max(90).required()   // latitude
      ).length(2).required()
    }).required(),
    images: Joi.array().items(
      Joi.string().uri().messages({
        'string.base': 'each image must be a string',
        'string.uri': 'each image must be a valid URL'
      })
    ).min(1).required().messages({
      'array.base': 'images must be an array of strings',
      'array.min': 'at least 1 image is required'
    }),
    videos: Joi.array().items(
      Joi.string().messages({
        'string.base': 'each video must be a string'
      })
    ).optional(),
  })
  try {
    // if (req.body.location && typeof req.body.location === 'string') {
    //   req.body.location = JSON.parse(req.body.location)
    // }
    // if (req.body.amenities && typeof req.body.amenities === 'string') {
    //   req.body.amenities = JSON.parse(req.body.amenities)
    // }
    // if (req.body.ward && typeof req.body.ward === 'string') {
    //   req.body.ward = JSON.parse(req.body.ward)[0]
    // }
    const data = req?.body ? req.body : {}
    await validationRule.validateAsync(data, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const updateRoomValidate = async (req, res, next) => {
  const validationRule = Joi.object({
    name: Joi.string().min(3).max(100).messages({
      'string.base': 'name must be a string',
      'string.empty': 'name cannot be empty',
      'string.min': 'name must be at least 3 characters long',
      'string.max': 'name must be at most 100 characters long'
    }).optional(),

    price: Joi.number().min(0).messages({
      'number.base': 'price must be a number',
      'number.min': 'price must be at least 0'
    }).optional(),

    amenities: Joi.array().items(
      Joi.string().pattern(OBJECT_ID_RULE).messages({
        'string.pattern.base': OBJECT_ID_RULE_MESSAGE
      })
    ).messages({
      'array.base': 'amenities must be an array of ObjectId strings'
    }).optional(),

    address: Joi.string().min(5).max(200).messages({
      'string.base': 'address must be a string',
      'string.min': 'address must be at least 5 characters long',
      'string.max': 'address must be at most 200 characters long'
    }).optional(),

    ward: Joi.string().pattern(OBJECT_ID_RULE).messages({
      'string.pattern.base': OBJECT_ID_RULE_MESSAGE
    }).optional(),

    location: Joi.object({
      type: Joi.string().valid('Point').default('Point'),
      coordinates: Joi.array().ordered(
        Joi.number().min(-180).max(180).required(), // longitude
        Joi.number().min(-90).max(90).required()   // latitude
      ).length(2).required()
    }).optional(),

    images: Joi.array().items(
      Joi.string().uri().messages({
        'string.uri': 'each image must be a valid URL'
      })
    ).min(1).messages({
      'array.base': 'images must be an array of strings'
    }).optional(),

    videos: Joi.array().items(
      Joi.string().messages({
        'string.base': 'each video must be a string'
      })
    ).optional()
  })
  try {
    const roomIdData = req?.params || {}
    const data = req?.body ? req.body : {}

    await idRule.validateAsync(roomIdData, { abortEarly: false })
    await validationRule.validateAsync(data, { abortEarly: false })

    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const updateAvailability = async (req, res, next) => {
  const schema = Joi.object({
    availability: Joi.string().valid('available', 'unavailable').required()
  })

  try {
    await schema.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    const messages = error.details.map(err => err.message).join(', ')
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, messages))
  }
}

const pagingValidate = async (req, res, next) => {
  const pagingRule = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('latest', 'rating', 'location', 'price').default('latest'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
  try {
    const data = req?.query ? req.query : {}
    await pagingRule.validateAsync(data, { abortEarly: false })
    next()
  } catch (error) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message)
  }
}

const updateRoomCoordinates = async (req, res, next) => {
  const validationRule = Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  })
  try {
    const roomIdData = req?.params || {}
    const data = req?.body ? req.body : {}
    await idRule.validateAsync(roomIdData, { abortEarly: false })
    await validationRule.validateAsync(data, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const searchValidate = async (req, res, next) => {
  const searchRule = Joi.object({
    name: Joi.string().min(2).optional().messages({
      'string.base': 'name must be a string',
      'string.min': 'name must be at least 2 characters long'
    }),

    amenity: Joi.string().optional().messages({
      'string.base': 'amenity must be a string'
    }),

    address: Joi.string().allow('').optional().messages({
      'string.base': 'address must be a string'
    }),

    district: Joi.string().allow('').optional().messages({
      'string.base': 'district must be a string'
    }),

    ward: Joi.string().allow('').optional().messages({
      'string.base': 'ward must be a string'
    }),

    minPrice: Joi.number().min(0).optional().messages({
      'number.base': 'minPrice must be a number',
      'number.min': 'minPrice must be at least 0'
    }),

    maxPrice: Joi.number().min(0).optional().messages({
      'number.base': 'maxPrice must be a number',
      'number.min': 'maxPrice must be at least 0'
    }),

    avgRating: Joi.number().min(0).max(5).optional().messages({
      'number.base': 'avgRating must be a number',
      'number.min': 'avgRating must be at least 0',
      'number.max': 'avgRating must be at most 5'
    }),

    totalRatings: Joi.number().integer().min(0).optional().messages({
      'number.base': 'totalRatings must be a number',
      'number.integer': 'totalRatings must be an integer',
      'number.min': 'totalRatings must be at least 0'
    }),
  });
}

const nearbyRooms = async (req, res, next) => {
  const nearbyRule = Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    distance: Joi.number().min(1).default(1000) // meters
  })
  try {
    const data = req?.query ? req.query : {}
    await nearbyRule.validateAsync(data, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const reportRoom = async (req, res, next) => {
  const reportRoomRule = Joi.object({
    reason: Joi.string().required().min(10).trim().messages({
      'string.empty': 'Lý do báo cáo không được để trống.',
      'string.min': 'Lý do báo cáo phải có ít nhất 10 ký tự.',
      'any.required': 'Lý do báo cáo là trường bắt buộc.',
    }),
  })

  try {
    const roomIdData = req?.params || {}
    const data = req?.body || {}
    await idRule.validateAsync(roomIdData, { abortEarly: false })
    await reportRoomRule.validateAsync(data, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

export const roomValidation = {
  createNew,
  updateRoomValidate,
  updateAvailability,
  pagingValidate,
  updateRoomCoordinates,
  searchValidate,
  nearbyRooms,
  reportRoom
}
