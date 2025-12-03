import jwt from 'jsonwebtoken'
import { jwtVerify } from '~/utils/jwt'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'


export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Token không được cung cấp'))

  try {
    const decoded = jwtVerify(token)
    req.user = decoded
    next()
  } catch (err) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Token không hợp lệ hoặc đã hết hạn'))
  }
}

// Chỉ admin
export const verifyAdmin = (req, res, next) => {
  if (!req.user || !req.user.role || req.user.role !== 'admin') {
    return next(new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền truy cập'))
  }
  next()
}

// Chỉ host
export const verifyHost = (req, res, next) => {
  if (!req.user || req.user.role !== 'host') {
    return next(new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền truy cập'))
  }
  next()
}

// Chỉ tenant
export const verifyTenant = (req, res, next) => {
  if (!req.user || req.user.role !== 'tenant') {
    return next(new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền truy cập'))
  }
  next()
}

// truyền role nào được phép 
export const verifyRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền truy cập'))
    }
    next()
  }
}
export const verifyTokenOptional = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = decoded
    } catch (err) {
      console.warn('Token optional không hợp lệ:', err.message)
    }
  }
  next()
}