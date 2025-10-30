import UserModel from '~/models/User.model.js'
import RoomModel from '~/models/Room.model.js'
import ReviewModel from '~/models/Review.model.js'

/**
 * Lấy thông tin cơ bản của host
 */
const getMe = async (hostId) => {
  const host = await UserModel.findById(hostId).select(
    'firstName lastName fullName email avatar role'
  )

  if (!host) return null

  return {
    id: host._id,
    email: host.email,
    fullName: host.fullName || `${host.firstName} ${host.lastName}`,
    avatar: host.avatar,
    role: host.role,
    isHost: host.role?.toLowerCase() === 'host'
  }
}

/**
 * Tổng quan số liệu của host
 */
const getOverviewStats = async (hostId) => {
  try {
    const now = new Date()

    const startOfThisWeek = new Date(now)
    startOfThisWeek.setDate(now.getDate() - now.getDay() + 1)
    startOfThisWeek.setHours(0, 0, 0, 0)

    const endOfThisWeek = new Date(startOfThisWeek)
    endOfThisWeek.setDate(startOfThisWeek.getDate() + 7)

    const startOfLastWeek = new Date(startOfThisWeek)
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7)
    const endOfLastWeek = new Date(startOfThisWeek)

    const calcGrowth = (thisWeek, lastWeek) => {
      if (lastWeek === 0) return thisWeek > 0 ? 100 : 0
      return ((thisWeek - lastWeek) / lastWeek) * 100
    }

    // Chỉ tính các phòng do host này đăng
    const thisWeekRooms = await RoomModel.countDocuments({
      createdBy: hostId,
      createdAt: { $gte: startOfThisWeek, $lt: endOfThisWeek }
    })
    const lastWeekRooms = await RoomModel.countDocuments({
      createdBy: hostId,
      createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek }
    })

    const thisWeekViewsAgg = await RoomModel.aggregate([
      {
        $match: {
          createdBy: hostId,
          createdAt: { $gte: startOfThisWeek, $lt: endOfThisWeek }
        }
      },
      { $group: { _id: null, total: { $sum: '$viewCount' } } }
    ])
    const lastWeekViewsAgg = await RoomModel.aggregate([
      {
        $match: {
          createdBy: hostId,
          createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek }
        }
      },
      { $group: { _id: null, total: { $sum: '$viewCount' } } }
    ])

    const thisWeekViews = thisWeekViewsAgg[0]?.total || 0
    const lastWeekViews = lastWeekViewsAgg[0]?.total || 0

    // Tổng số phòng của host
    const totalRooms = await RoomModel.countDocuments({ createdBy: hostId })

    // Tổng review của các phòng host này
    const totalReviews = await ReviewModel.countDocuments({ hostId })

    return {
      totalRooms,
      totalReviews,
      thisWeek: {
        rooms: thisWeekRooms,
        views: thisWeekViews
      },
      growth: {
        rooms: calcGrowth(thisWeekRooms, lastWeekRooms),
        views: calcGrowth(thisWeekViews, lastWeekViews)
      }
    }
  } catch (error) {
    throw error
  }
}

/**
 * Thống kê số lượt tạo phòng bởi host theo ngày/tuần/tháng
 */
const getDailyStats = async (hostId) => {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 7)

    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)

    const daily = await RoomModel.countDocuments({
      createdBy: hostId,
      createdAt: { $gte: today }
    })
    const weekly = await RoomModel.countDocuments({
      createdBy: hostId,
      createdAt: { $gte: sevenDaysAgo }
    })
    const monthly = await RoomModel.countDocuments({
      createdBy: hostId,
      createdAt: { $gte: thirtyDaysAgo }
    })

    return { daily, weekly, monthly }
  } catch (error) {
    throw error
  }
}

/**
 * Top 5 phòng được xem nhiều nhất của host
 */
const getTopViewedRooms = async (hostId) => {
  try {
    const topRooms = await RoomModel.find({ createdBy: hostId, status: 'approved' })
      .sort({ viewCount: -1 })
      .limit(5)
      .select('name address images avgRating viewCount totalLikes totalRatings')

    return topRooms
  } catch (error) {
    throw error
  }
}

/**
 * Danh sách review cho các phòng của host
 */
const getMyReviews = async (hostId, paging = { page: 1, limit: 10 }) => {
  try {
    const { page, limit } = paging

    // Tìm review thuộc về phòng mà host này tạo
    const rooms = await RoomModel.find({ createdBy: hostId }).select('_id')
    const roomIds = rooms.map((r) => r._id)

    const reviews = await ReviewModel.find({ roomId: { $in: roomIds } })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'fullName email avatar')
      .sort({ createdAt: -1 })

    const total = await ReviewModel.countDocuments({ roomId: { $in: roomIds } })

    return { reviews, total, page, limit }
  } catch (error) {
    throw error
  }
}

export const hostService = {
  getMe,
  getOverviewStats,
  getDailyStats,
  getTopViewedRooms,
  getMyReviews
}
