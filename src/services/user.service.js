import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { jwtGenerate, requestNewToken } from '~/utils/jwt'
import UserModel from '~/models/User.model.js'
import OTPModel from '~/models/OTP.model.js'
import ReviewModel from '~/models/Review.model.js'
import CheckinModel from '~/models/Checkin.model.js'
import RefreshTokenModel from '~/models/RefreshToken.model'
import sendMail from '~/utils/sendMail.js'

const generateAndSaveOTP = async (email) => {
  if (!email) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email is required to generate OTP')
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const otpData = {
    email,
    otp
  }
  // Save OTP to the database (you need to implement this function)
  await OTPModel.create(otpData)
  return otp
}

const register = async (registerData) => {
  try {
    const existingUser = await UserModel.findOne({ email: registerData.email })

    if (existingUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email is already exists')
    }

    const newUser = await UserModel.create(registerData)

    return newUser
  } catch (error) { throw error }
}

const login = async (loginData) => {
  try {
    const user = await UserModel.findOne({ email: loginData.email })
      .select('_id role email firstName lastName password banned')
    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password')
    }
    const isPasswordValid = await user.comparePassword(loginData.password)
    if (!isPasswordValid) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password')
    }
    if (user.banned) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Your account has been banned')
    }

    const { AcessToken, RefreshToken } = jwtGenerate({ id: user._id, email: user.email, role: user.role })

    await RefreshTokenModel.create({ userId: user._id, token: RefreshToken })

    await user.saveLog(loginData.ipAddress, loginData.device)
    const userData = {
      userId: user._id,
      role: user.role,
      email: user.email,
      fullName: user.firstName + ' ' + user.lastName
    }
    return { userData, accessToken: AcessToken, refreshToken: RefreshToken }
  } catch (error) {
    throw error
  }
}

const requestToken = async ({ refreshToken }) => {
  try {
    const refreshTokenDoc = await RefreshTokenModel.findOne({ token: refreshToken })
    if (!refreshTokenDoc) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh Token không hợp lệ hoặc đã hết hạn')
    }
    const newTokens = requestNewToken(refreshToken)
    return newTokens
  } catch (error) {
    throw error
  }
}

const revokeRefreshToken = async (userId) => {
  try {
    await RefreshTokenModel.deleteMany({ userId })
    return { message: 'Refresh tokens revoked successfully' }
  } catch (error) {
    throw error
  }
}

const getAllUsers = async () => {
  try {
    const users = await UserModel.find({ role: 'user' }).select('-password')
    return users
  } catch (error) {
    throw error
  }
}

const changePassword = async (userId, passwordData) => {
  try {
    const user = await UserModel.findById(userId)
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }
    const isCurrentPasswordValid = await user.comparePassword(passwordData.currentPassword)
    if (!isCurrentPasswordValid) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Current password is incorrect')
    }
    user.password = passwordData.newPassword
    user.updatedAt = Date.now() // Update the updatedAt field
    await user.save()
    return { message: 'Password changed successfully' }
  } catch (error) {
    throw error
  }
}

const sendOTP = async (reqBody) => {
  try {
    const { email } = reqBody
    const otp = await generateAndSaveOTP(email)
    await sendMail(email, 'Your OTP Code', `Your OTP code is ${otp}`)
    return otp
  } catch (error) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to sent send OTP email')
  }
}

const verifyOTP = async (otpData) => {
  try {
    const { email, otp } = otpData
    const otpRecord = await OTPModel.findOne({ email, otp })

    if (!otpRecord) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid OTP')
    }
    await otpRecord.verifyOTP()

    return { message: 'OTP verified successfully' }
  } catch (error) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to verify OTP')
  }
}

const resetPassword = async (reqBody) => {
  try {
    const { email, otp, newPassword } = reqBody
    const otpRecord = await OTPModel.findOne({ email, otp })

    if (!otpRecord || !otpRecord.isVerified) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired OTP')
    }

    const user = await UserModel.findOne({ email })
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    user.password = newPassword
    await user.save()
    await OTPModel.deleteOne({ _id: otpRecord._id }) // Optionally delete the OTP record

    return { message: 'Password reset successfully' }
  } catch (error) {
    throw error
  }
}

// Aggregate user details after implementing other modals (Places, Checkins, etc.)
const getUserProfile = async (userId) => {
  try {
    const user = await UserModel.findById(userId)
    if (!user || user.role !== 'user' || user._destroyed) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }
    if (user.banned) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'This account has been banned')
    }
    const profile = {
      userId: user._id,
      email: user.email,
      fullName: `${user.firstName} ${user.lastName}`,
      phoneVerified: user.phoneVerified,
      emailVerified: user.emailVerified
    }
    return profile
  } catch (error) {
    throw error
  }
}

const getUserDetails = async (userId) => {
  try {
    const user = await UserModel.find({ _id: userId, role: 'user' })
      .select('-password -__v')

    if (!user ||user.length === 0) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }
    const returnedUser = user[0]
    return { ...returnedUser.toObject(), checkins: userCheckins }
  } catch (error) {
    throw error
  }
}

const banUser = async (userId) => {
  try {
    const user = await UserModel.findById(userId)
    if (!user || user.role !== 'user') {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }
    if (user.banned) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'User is already banned')
    }
    user.banned = true
    await user.save()
  } catch (error) {
    throw error
  }
}

const destroyUser = async (userId) => {
  try {
    const user = await UserModel.findById(userId)
    if (!user || user.role !== 'user') {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }
    user._destroyed = true
    await user.save()
  } catch (error) {
    throw error
  }
}

const updateUserProfile = async (userId, reqBody) => {
  try {
    const updateData = {
      ...reqBody,
      emailVerified: reqBody?.emailVerified || false,
      phoneVerified: reqBody?.phoneVerified || false,
      updatedAt: Date.now() // Update the updatedAt field
    }
    const user = await UserModel.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true })
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }
    return user
  } catch (error) {
    throw error
  }
}

export const userService = {
  register,
  login,
  resetPassword,
  requestToken,
  revokeRefreshToken,
  getAllUsers,
  changePassword,
  sendOTP,
  verifyOTP,
  getUserDetails,
  getUserProfile,
  banUser,
  destroyUser,
  updateUserProfile,
}