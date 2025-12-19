import { adminService } from '../services/admin.service.js'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../utils/ApiError.js'

const getMe = async (req, res, next) => {
  try {
    const adminId = req.user?.id
    if (!adminId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Token không hợp lệ hoặc thiếu ID')
    }

    const admin = await adminService.getMe(adminId)

    if (!admin) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Không tìm thấy user')
    }

    if (!admin.isAdmin) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền admin')
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        avatar: admin.avatar,
        role: admin.role
      }
    })
  } catch (error) {
    next(error)
  }
}

const getOverviewStats = async (req, res, next) => {
  try {
    const stats = await adminService.getOverviewStats()
    res.status(StatusCodes.OK).json({
      success: true,
      data: stats
    })
  } catch (error) {
    next(error)
  }
}

const getDailyStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDailyStats()
    res.status(StatusCodes.OK).json({
      success: true,
      data: stats
    })
  } catch (error) {
    next(error)
  }
}
const getLoginStats = async (req, res, next) => {
  try {
    const stats = await adminService.getLoginStats()
    res.status(StatusCodes.OK).json({
      success: true,
      data: stats
    })
  } catch (error) {
    next(error)
  }
}

const getTopViewedRooms = async (req, res, next) => {
  try {
    const rooms = await adminService.getTopViewedRooms()
    res.status(StatusCodes.OK).json({
      success: true,
      data: rooms
    })
  } catch (error) {
    next(error)
  }
}

const getPopularStats = async (req, res, next) => {
  try {
    const stats = await adminService.getPopularStats()
    res.status(StatusCodes.OK).json({
      success: true,
      data: stats
    })
  } catch (error) {
    next(error)
  }
}

const getFilteredReviews = async (req, res, next) => {
  try {
    const reviews = await adminService.getFilteredReviews(req.query, req.body)
    res.status(StatusCodes.OK).json({
      success: true,
      data: reviews
    })
  } catch (error) {
    next(error)
  }
}

const getReviewReports = async (req, res, next) => {
  try {
    const reviews = await adminService.getReviewReports()
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Thống kê báo cáo đánh giá thành công',
      data: reviews
    })
  } catch (error) {
    next(error)
  }
}

const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params
    const deletedReview = await adminService.deleteReview(id)
    res.status(StatusCodes.OK).json({
      success: true,
      data: deletedReview
    })
  } catch (error) {
    next(error)
  }
}

const hideReview = async (req, res, next) => {
  try {
    const { id } = req.params
    const review = await adminService.hideReview(id)
    res.status(StatusCodes.OK).json({
      success: true,
      data: review
    })
  } catch (error) {
    next(error)
  }
}
const getUserMonthlyStats = async (req, res, next) => {
  try {
    const stats = await adminService.getUserMonthlyStats()
    res.status(StatusCodes.OK).json({
      success: true,
      data: stats
    })
  } catch (error) {
    next(error)
  }
}

const getTopHosts = async (req, res, next) => {
  try {
    const topHosts = await adminService.getTopHosts()
    res.status(StatusCodes.OK).json({
      success: true,
      data: topHosts
    });
  } catch (error) {
    next(error)
  }
}

const getReportStats = async (req, res, next) => {
  try {
    const data = await adminService.getReportsStats();
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Thống kê báo cáo thành công",
      data
    });
  } catch (error) {
    next(error);
  }
}

const processReports = async (req, res, next) => {
  try {
    const { type, id, action } = req.body
    
    // Validate nếu có params cho xử lý thủ công
    if (type || id || action) {
      if (!type || !id || !action) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Thiếu tham số. Cần truyền đủ type, id và action')
      }
      if (!['room', 'review'].includes(type)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Loại báo cáo không hợp lệ. Sử dụng "room" hoặc "review"')
      }
      if (!['approve', 'reject'].includes(action)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Hành động không hợp lệ. Sử dụng "approve" hoặc "reject"')
      }
    }

    const result = await adminService.handleReports({ type, id, action });
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
      mode: result.mode,
      data: result.mode === 'auto' 
        ? { topRooms: result.topRooms, topReviews: result.topReviews }
        : result.data
    });
  } catch (error) {
    next(error);
  }
}

const getTopAmenities = async (req, res, next) => {
  try {
    const amenities = await adminService.getTopAmenities()
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Lấy top 5 tiện ích phổ biến thành công',
      data: amenities
    })
  } catch (error) {
    next(error)
  }
}

const getTopWards = async (req, res, next) => {
  try {
    const wards = await adminService.getTopWards()
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Lấy top 5 khu vực có nhiều phòng nhất thành công',
      data: wards
    })
  } catch (error) {
    next(error)
  }
}

export const adminController = {
  getMe,
  getOverviewStats,
  getDailyStats,
  getPopularStats,
  getFilteredReviews,
  deleteReview,
  hideReview,
  getTopViewedRooms,
  getLoginStats,
  getUserMonthlyStats,
  getTopHosts,
  getReviewReports,
  getReportStats,
  processReports,
  getTopAmenities,
  getTopWards
}
