import { StatusCodes } from 'http-status-codes'
import { userService } from '~/services/user.service'

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id
    const profile = await userService.getUserProfile(userId)
    res.status(StatusCodes.OK).json({
      message: 'Profile retrieved successfully',
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

export const profileController = {
  getProfile,
  updateProfile
}