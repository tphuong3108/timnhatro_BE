import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError.js'
import { hostService } from '~/services/host.service.js'

/**
 * Lấy thông tin cơ bản của host hiện tại
 */
const getMe = async (req, res, next) => {
  try {
    const hostId = req.user?.id
    if (!hostId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Token không hợp lệ hoặc thiếu ID')
    }

    const host = await hostService.getMe(hostId)
    if (!host) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy host')
    }

    if (!host.isHost) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền host')
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: host
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Tổng quan số liệu host
 */
const getOverviewStats = async (req, res, next) => {
  try {
    const hostId = req.user?.id
    const stats = await hostService.getOverviewStats(hostId)
    res.status(StatusCodes.OK).json({
      success: true,
      data: stats
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Số liệu theo ngày/tuần/tháng
 */
const getDailyStats = async (req, res, next) => {
  try {
    const hostId = req.user?.id
    const stats = await hostService.getDailyStats(hostId)
    res.status(StatusCodes.OK).json({
      success: true,
      data: stats
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Top 5 phòng được xem nhiều nhất
 */
const getTopViewedRooms = async (req, res, next) => {
  try {
    const hostId = req.user?.id
    const topRooms = await hostService.getTopViewedRooms(hostId)
    res.status(StatusCodes.OK).json({
      success: true,
      data: topRooms
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Danh sách review cho các phòng của host
 */
const getMyReviews = async (req, res, next) => {
  try {
    const hostId = req.user?.id
    const paging = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    }

    const result = await hostService.getMyReviews(hostId, paging)
    res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const hostController = {
  getMe,
  getOverviewStats,
  getDailyStats,
  getTopViewedRooms,
  getMyReviews
}
