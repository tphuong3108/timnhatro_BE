import { rateLimit } from 'express-rate-limit'

export const createRateLimiter = ({ maxRequests, windowMs, message = 'Too many requests, please try again later.' }) => {
  return rateLimit({
    windowMs: windowMs, // Time window in milliseconds
    limit: maxRequests, // Maximum number of requests allowed within the time window
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    ipv6Subnet: 56,
    message: {
      statusCode: 429,
      message: message
    }
  })
}

// 5 requests per 5 minutes
export const loginRateLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 5 * 60 * 1000,
  message: 'Too many login attempts, please try again later.'
})

// 10 requests per hour
export const registerRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 60 * 1000,
  message: 'Too many registration attempts, please try again later.'
})

// 5 requests per minute
export const verifyOtpRateLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000
})

// 60 requests per minute
export const placeRateLimiter = createRateLimiter({
  maxRequests: 60,
  windowMs: 60 * 1000
})


export const blogRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000
})

export const reviewRateLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000,
  message: 'Too many review submissions, please try again later.'
})

export const commentRateLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000,
  message: 'Too many comment submissions, please try again later.'
})

export const shareRateLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000,
  message: 'Too many share attempts, please try again later.'
})

