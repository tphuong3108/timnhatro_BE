import { StatusCodes } from 'http-status-codes'
import { userService } from '~/services/user.service.js'
import UserModel from '~/models/User.model.js'

//role: tenant(Người tìm trọ), host(Chủ trọ), admin(Quản trị viên)

const register = async (req, res, next) => {
  try {
    const result = await userService.register(req.body)

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: result.message
    })
  } catch (error) {
    next(error)
  }
}

const verifyEmail = async (req, res, next) => {
  try {
    const result = await userService.verifyEmail(req.body);
    res.status(StatusCodes.OK).json({ 
      success: true, 
      message: result.message 
    });
  } catch (error) {
    next(error);
  }
};

const sendPasswordResetOTP = async (req, res, next) => {
  try {
    const result = await userService.sendPasswordResetOTP(req.body.email);
    res.status(StatusCodes.OK).json({ 
      success: true, 
      message: result.message 
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { userData, accessToken, refreshToken } = await userService.login({
      ...req.body,
      ipAddress: req.ip,
      device: req.headers['user-agent']
    })

    let updatedUser = null
    if (userData && userData.userId) {
      updatedUser = await UserModel.findByIdAndUpdate(
        userData.userId,
        { $inc: { loginCount: 1 } },
        { new: true } 
      ).select('firstName lastName email avatar role loginCount')
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Đăng nhập thành công',
      user: updatedUser || userData,
      accessToken,
      refreshToken
    })
  } catch (error) {
    next(error)
  }
}


const logout = async (req, res, next) => {
  try {
    const userId = req.user.id // Assuming user ID is stored in req.user by verifyToken middleware
    await userService.revokeRefreshToken(userId)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Đăng xuất thành công'
    })
  } catch (error) {
    next(error)
  }
}

const requestToken = async (req, res, next) => {
  try {
    const newToken = await userService.requestToken(req.body)
    res.status(StatusCodes.OK).json({
      success: true,
      accessToken: newToken
    })
  } catch (error) {
    next(error)
  }
}

const getAllUsers = async (req, res, next) => {
  try {
    // Lấy role từ query: ?role=host hoặc ?role=host,tenant
    const { role } = req.query
    const roles = role ? role.split(',') : []

    const users = await userService.getAllUsers(roles)
    res.status(StatusCodes.OK).json(users)
  } catch (error) {
    next(error)
  }
}

const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id // Assuming user ID is stored in req.user by verifyToken middleware
    await userService.changePassword(userId, req.body)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    })
  } catch (error) {
    next(error)
  }
}

const getProfile = async (req, res, next) => {
  try {
    const userId = req?.query?.userId || req.user.id || req.user._id || req.user.userId
    const profile = await userService.getUserProfile(userId)
    res.status(StatusCodes.OK).json({
      success: true,
      user: profile
    });
  } catch (error) {
    next(error)
  }
}

const getUserDetails = async (req, res, next) => {
  try {
    const userId = req.params.id
    const userDetails = await userService.getUserDetails(userId)
    res.status(StatusCodes.OK).json({
      success: true,
      user: userDetails
    })
  } catch (error) {
    next(error)
  }
}

const banUser = async (req, res, next) => {
  try {
    const userId = req.params.id
    await userService.banUser(userId)
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'User has been banned successfully'
    })
  } catch (error) {
    next(error)
  }
}
const banSelf = async (req, res, next) => {
  try {
    const userId = req.user.id; 
    await userService.banUser(userId);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Tài khoản của bạn đã bị khóa thành công'
    });
  } catch (error) {
    next(error);
  }
};


const destroyUser = async (req, res, next) => {
  try {
    const userId = req.params.id
    await userService.destroyUser(userId)
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'User has been deleted successfully'
    })
  } catch (error) {
    next(error)
  }
}

const resetPassword = async (req, res, next) => {
  try {
    await userService.resetPassword(req.body)
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Password reset successfully'
    })
  } catch (error) {
    next(error)
  }
}

const updateUserLocation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { longitude, latitude } = req.body;
    const result = await userService.updateUserLocation(userId, longitude, latitude);
    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

const oAuthLoginCallback = async (req, res, next) => {
  try {
    const { accessToken, refreshToken } = await userService.handleOAuthLogin(
      req.user,
      req.ip,
      req.headers['user-agent']
    )

    // Chuyển hướng đến CLIENT_URL với tokens dưới dạng query params
    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}?accessToken=${accessToken}&refreshToken=${refreshToken}`
    res.redirect(redirectUrl)
  } catch (error) {
    // Nếu có lỗi, chuyển hướng đến trang lỗi đăng nhập trên client
    const failureRedirectUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/login-failure`
    res.redirect(failureRedirectUrl)
  }
}

export const userController = {
  register,
  login,
  logout,
  resetPassword,
  requestToken,
  getAllUsers,
  getUserDetails,
  changePassword,
  verifyEmail,
  sendPasswordResetOTP,
  getProfile,
  banUser,
  banSelf,
  destroyUser,
  updateUserLocation,
  oAuthLoginCallback
}