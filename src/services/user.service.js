import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { jwtGenerate, requestNewToken } from '~/utils/jwt'
import UserModel from '~/models/User.model.js'
import OTPModel from '~/models/OTP.model.js'
import RefreshTokenModel from '~/models/RefreshToken.model'
import sendMail from '~/utils/sendMail.js'
import ReviewModel from '~/models/Review.model.js'
import RoomModel from '~/models/Room.model.js'

const register = async (userData) => {
  try {
    const { email, firstName, lastName, password, avatar, phone } = userData;
    let user = await UserModel.findOne({ email });

    if (user && user.emailVerified) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email already exists');
    }

    await OTPModel.deleteMany({ email: email, type: 'registration' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpData = {
      email,
      otp,
      type: 'registration',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      registrationData: {
        firstName,
        lastName,
        password,
        avatar,
        phone
      }
    }; 
    await OTPModel.create(otpData);
    await sendMail(email, 'Your OTP Code for Registration', `Your OTP code is ${otp}`);
    return { message: 'Registration successful. Please check your email for the OTP to verify your account.' };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to register user');
  }
}


const verifyEmail = async (verificationData) => {
  try {
    const { email, otp } = verificationData
    const otpRecord = await OTPModel.findOne({ email, otp, type: 'registration', expiresAt: { $gt: new Date() } })

    if (!otpRecord) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired OTP')
    }

    const { firstName, lastName, password, avatar, phone } = otpRecord.registrationData

    // Find user by email
    let user = await UserModel.findOne({ email })

    if (user) {
      // User exists (should be unverified based on register logic)
      if (user.emailVerified) {
        // Should not happen if register logic is correct
        throw new ApiError(StatusCodes.CONFLICT, 'Email is already verified.')
      }
      // Update existing unverified user
      user.firstName = firstName
      user.lastName = lastName
      user.password = password // This will be hashed on save by the pre-save hook
      user.phone = phone
      user.avatar = avatar
      user.emailVerified = true
    } else {
      // User does not exist, create a new one
      user = new UserModel({
        firstName,
        lastName,
        email,
        phone,
        avatar,
        password,
        emailVerified: true
      })
    }

    await user.save() // Save either the updated or the new user

    await OTPModel.deleteOne({ _id: otpRecord._id })
    return { message: 'Email verified successfully. You can now log in.' }
  } catch (error) {
    console.error('Error details:', error);
    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, `Duplicate field: ${Object.keys(error.keyValue)}`);
    }
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to verify email');
  }
}

const sendPasswordResetOTP = async (email) => {
  try {
    const user = await UserModel.findOne({ email });
    if (!user || !user.emailVerified) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found or email not verified');
    }

    await OTPModel.deleteMany({ email: email, type: 'password-reset' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpData = { email, otp, type: 'password-reset', expiresAt: new Date(Date.now() + 5 * 60 * 1000) };
    await OTPModel.create(otpData);

    await sendMail(email, 'Your Password Reset OTP', `Your OTP code for password reset is ${otp}`);

    return { message: 'Password reset OTP sent successfully.' };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to send password reset OTP');
  }
}

const login = async (loginData) => {
  try {
    const user = await UserModel.findOne({ email: loginData.email })
      .select('_id role email firstName lastName password banned emailVerified _destroyed');

    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
    }

    if (!user.emailVerified) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Please verify your email before logging in.');
    }

    if (user.banned || user._destroyed) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Your account has been banned or deleted');
    }

    const isPasswordValid = await user.comparePassword(String(loginData.password).trim());
    if (!isPasswordValid) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
    }

    const { AccessToken, RefreshToken } = jwtGenerate({ id: user._id, email: user.email, role: user.role });

    await RefreshTokenModel.create({ userId: user._id, token: RefreshToken });
    await user.saveLog(loginData.ipAddress, loginData.device);

    const userData = {
      userId: user._id,
      role: user.role,
      email: user.email,
      fullName: user.firstName + ' ' + user.lastName
    };

    return { userData, accessToken: AccessToken, refreshToken: RefreshToken };
  } catch (error) {
    throw error;
  }
}

const handleOAuthLogin = async (user, ipAddress, device) => {
  try {
    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User information is missing from OAuth provider.');
    }

    if (user.banned || user._destroyed) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Your account has been banned or deleted');
    }

    const { AccessToken, RefreshToken } = jwtGenerate({ id: user._id, email: user.email, role: user.role });

    await RefreshTokenModel.create({ userId: user._id, token: RefreshToken });
    await user.saveLog(ipAddress, device);

    const userData = {
      userId: user._id,
      role: user.role,
      email: user.email,
      fullName: user.firstName + ' ' + user.lastName
    };

    return { userData, accessToken: AccessToken, refreshToken: RefreshToken };
  } catch (error) {
    throw error;
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

const getAllUsers = async (roles = []) => {
  try {
    // Nếu truyền roles thì lọc theo roles, không thì lấy host + tenant mặc định
    const baseFilter = roles.length
      ? { role: { $in: roles } }
      : { role: { $in: ['host', 'tenant'] } }
    
    const filter = { ...baseFilter, _destroyed: { $ne: true } }

    const users = await UserModel.find(filter).select('-password')
    return users
  } catch (error) {
    throw error
  }
}

const getUserDetails = async (userId) => {
  try {
    const user = await UserModel.findById(userId)
      .select('-password -__v')
      .populate('favorites', 'name address avgRating totalRatings')
      .populate('sharedRooms', 'title content');

    if (!user ||  user._destroyed) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }
    if (user.banned) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'This account has been banned')
    }

    const now = new Date()
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const rooms = await RoomModel.find({ authorId: userId }).sort({ createdAt: -1 })
    const totalRooms = rooms.length
    const thisMonthRooms = await RoomModel.countDocuments({
      authorId: userId,
      createdAt: { $gte: startOfThisMonth }
    });
    const lastMonthRooms = await RoomModel.countDocuments({
      authorId: userId,
      createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth }
    });
    const roomGrowth =
      lastMonthRooms > 0
        ? Math.round(((thisMonthRooms - lastMonthRooms) / lastMonthRooms) * 100)
        : thisMonthRooms > 0 ? 100 : 0

    const reviews = await ReviewModel.find({ userId });
    const totalReviews = reviews.length
    const thisMonthReviews = await ReviewModel.countDocuments({
      userId,
      createdAt: { $gte: startOfThisMonth }
    });
    const lastMonthReviews = await ReviewModel.countDocuments({
      userId,
      createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth }
    });
    const reviewGrowth =
      lastMonthReviews > 0
        ? Math.round(((thisMonthReviews - lastMonthReviews) / lastMonthReviews) * 100)
        : thisMonthReviews > 0 ? 100 : 0

    return {
      userId: user._id,
      fullName: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar || null,
      cover: user.cover || null,
      phone: user.phone || '',
      email: user.email,
      points: user.points || 0,
      favorites: user.favorites || [],
      sharedRooms: user.sharedRooms || [],

      roomCount: totalRooms,
      reviewCount: totalReviews,

      roomGrowth,
      reviewGrowth,

      rooms
    };
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

const resetPassword = async (reqBody) => {
  try {
    const { email, otp, newPassword } = reqBody
    const otpRecord = await OTPModel.findOne({ email, otp, type: 'password-reset', expiresAt: { $gt: new Date() } })

    if (!otpRecord) {
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

const getMyProfile = async (userId) => {
  try {
    const user = await UserModel.findById(userId)
      .select('-password -__v')
      .populate({
        path: 'favorites',
        select: 'name slug address price images videos avgRating totalRatings'
      })
      .populate('sharedRooms', 'title content status');

    if (!user || !['tenant', 'host'].includes(user.role) || user._destroyed) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }
    if (user.banned) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'This account has been banned');
    }

    const reviews = await ReviewModel.find({ user: userId })
      .populate('room', 'name address avgRating totalRatings')
      .select('rating comment createdAt updatedAt');

    let myRooms = [];
    if (user.role === 'host') {
      myRooms = await RoomModel.find({ createdBy: userId, isDeleted: false })
        .populate('amenities', 'name')
        .populate('ward', 'name')
        .select(
          'name slug description price amenities address ward images videos avgRating status availability createdAt updatedAt'
        );
    }

    return {
      id: user._id,
      email: user.email,
      fullName: `${user.firstName} ${user.lastName}`,
      role: user.role,
      avatar: user.avatar || null,
      phone: user.phone || '',
      bio: user.bio || '',
      favorites: user.favorites || [],
      sharedRooms: user.sharedRooms || [],
      reviews: reviews || [],
      myRooms,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  } catch (error) {
    throw error;
  }
};


const getPublicProfile = async (userId) => {
  try {
    const user = await UserModel.findById(userId)
      .select('firstName lastName avatar role bio banned _destroyed')

    if (!user || user._destroyed === true) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }
    if (user.banned === true) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'This account has been banned')
    }

    let publicRooms = []
    if (user.role === 'host' || user.role === 'admin') {
      publicRooms = await RoomModel.find({ createdBy: userId, isDeleted: false, status: 'approved' })
        .populate('amenities', 'name')
        .populate('ward', 'name')
        .select('name slug description price amenities address ward images videos avgRating status availability createdAt updatedAt')
    }

    return {
      id: user._id,
      fullName: `${user.firstName} ${user.lastName}`,
      role: user.role,
      avatar: user.avatar || null,
      bio: user.bio || '',
      publicRooms: publicRooms
    }
  } catch (error) {
    throw error
  }
}

const banUser = async (userId, currentUser) => {
  try {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền thực hiện hành động này');
    }
    const user = await UserModel.findById(userId)
    if (!user || !['host', 'tenant'].includes(user.role)) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }
    // Không cho phép admin tự khoá admin khác
    if (user.role === 'admin') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Không thể khoá tài khoản admin khác');
    }
    if (user.banned) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'User is already banned')
    }
    user.banned = true
    await user.save()
    return { message: 'Tài khoản đã bị khóa thành công' };
  } catch (error) {
    throw error
  }
}
const banSelf = async (userId) => {
  try {
    const user = await UserModel.findById(userId)
    if (!user || !['host', 'tenant'].includes(user.role)) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }
    if (user.banned) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Tài khoản đã bị khóa trước đó');
    }
    user.banned = true
    await user.save()
    return { message: 'Tài khoản của bạn đã được khóa thành công'}; 
  } catch (error) {
    throw error
  }
}

const destroyUser = async (userId, currentUser) => {
  try {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền thực hiện hành động này');
    }

    const user = await UserModel.findById(userId)
    if (!user || !['host', 'tenant'].includes(user.role)) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    //Không cho phép xóa admin khác
    if (user.role === 'admin') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Không thể xóa tài khoản admin');
    }
    if (user._destroyed) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'User has already been deleted');
    }
    user._destroyed = true
    await user.save()
    return { message: 'User has been deleted (soft delete) successfully' };
  } catch (error) {
    throw error
  }
}

const updateUserProfile = async (userId, reqBody) => {
  try {
    const updateData = {
      ...reqBody,
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

const updateUserLocation = async (userId, longitude, latitude) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }
    user.currentLocation = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };
    await user.save();
    return { message: 'User location updated successfully' };
  } catch (error) {
    throw error;
  }
};

const upgradeToHost = async (userId) => {
  const user = await UserModel.findById(userId)

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng.')
  }

  if (user.role !== 'tenant') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Chỉ người dùng tenant mới có thể nâng cấp lên host.')
  }

  if (user.banned || user._destroyed) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Tài khoản này không thể thay đổi quyền.')
  }

  user.role = 'host'
  user.updatedAt = new Date()
  await user.save()

  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    newRole: user.role
  }
}

export const userService = {
  register,
  login,
  handleOAuthLogin,
  resetPassword,
  requestToken,
  revokeRefreshToken,
  getAllUsers,
  getUserDetails,
  changePassword,
  verifyEmail,
  sendPasswordResetOTP,
  getMyProfile,
  getPublicProfile,
  banUser,
  banSelf,
  destroyUser,
  updateUserProfile,
  updateUserLocation,
  upgradeToHost
}