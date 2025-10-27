import { StatusCodes } from 'http-status-codes'
import { userService } from '~/services/user.service'

const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id
    const profile = await userService.getMyProfile(userId)
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Your profile retrieved successfully',
      data: profile
    })
  } catch (error) {
    next(error)
  }
}

const getPublicProfile = async (req, res, next) => {
  try {
    const userId = req.params.id || req.query.userId
    const profile = await userService.getPublicProfile(userId)
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Public profile retrieved successfully',
      data: profile
    })
  } catch (error) {
    next(error)
  }
}

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id
    const updatedProfile = await userService.updateUserProfile(userId, req.body)
    res.status(StatusCodes.OK).json({
      message: 'Profile updated successfully',
      data: updatedProfile
    })
  } catch (error) {
    next(error)
  }
}

const getUserReviews = async (req, res, next) => {
  try {
    const userId = req.user.id
    const reviews = await userService.getUserReviews(userId)
    res.status(StatusCodes.OK).json({
      'success': true,
      'data': reviews
    })
  } catch (error) {
    next(error)
  }
}

const upgradeToHost = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await userService.upgradeToHost(userId)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Nâng cấp quyền thành công.',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const profileController = {
  getMyProfile,
  getPublicProfile,
  updateProfile,
  getUserReviews,
  upgradeToHost
}