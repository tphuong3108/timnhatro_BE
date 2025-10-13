import UserModel from '~/models/User.model.js'
import RoomModel from '~/models/Room.model.js'
import ReviewModel from '../models/Review.model'

const getMe = async (adminId) => {
  const admin = await UserModel.findById(adminId).select(
    'firstName lastName fullName email avatar role'
  )

  if (!admin) return null

  return {
    id: admin._id,
    email: admin.email,
    fullName: admin.fullName || `${admin.firstName} ${admin.lastName}`,
    avatar: admin.avatar,
    role: admin.role,
    isAdmin: admin.role?.toLowerCase() === 'admin'
  }
}
const getLoginStats = async () => {
  try {
    const totalLogins = await UserModel.aggregate([
      { $group: { _id: null, total: { $sum: '$loginCount' } } }
    ])

    const topUsersByLogin = await UserModel.find()
      .sort({ loginCount: -1 })
      .limit(5)
      .select('fullName email avatar loginCount')

    return {
      totalLogins: totalLogins[0]?.total || 0,
      topUsersByLogin
    }
  } catch (error) {
    throw error
  }
}

const getOverviewStats = async () => {
  try {
    const now = new Date();

    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay() + 1)
    startOfThisWeek.setHours(0, 0, 0, 0)

    const endOfThisWeek = new Date(startOfThisWeek)
    endOfThisWeek.setDate(startOfThisWeek.getDate() + 7)

    const startOfLastWeek = new Date(startOfThisWeek)
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7)

    const endOfLastWeek = new Date(startOfThisWeek);

    const calcGrowth = (thisWeek, lastWeek) => {
      if (lastWeek === 0) return thisWeek > 0 ? 100 : 0
      return ((thisWeek - lastWeek) / lastWeek) * 100
    }

    const thisWeekUsers = await UserModel.countDocuments({
      createdAt: { $gte: startOfThisWeek, $lt: endOfThisWeek }
    })
    const lastWeekUsers = await UserModel.countDocuments({
      createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek }
    })

    const thisWeekRooms = await RoomModel.countDocuments({
      createdAt: { $gte: startOfThisWeek, $lt: endOfThisWeek }
    })
    const lastWeekRooms = await RoomModel.countDocuments({
      createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek }
    })

    const thisWeekViewsAgg = await RoomModel.aggregate([
      { $match: { createdAt: { $gte: startOfThisWeek, $lt: endOfThisWeek } } },
      { $group: { _id: null, total: { $sum: '$viewCount' } } }
    ])
    const lastWeekViewsAgg = await RoomModel.aggregate([
      { $match: { createdAt: { $gte: startOfLastWeek, $lt: endOfLastWeek } } },
      { $group: { _id: null, total: { $sum: '$viewCount' } } }
    ])

    const thisWeekViews = thisWeekViewsAgg[0]?.total || 0
    const lastWeekViews = lastWeekViewsAgg[0]?.total || 0

    return {
      users: thisWeekUsers,
      rooms: thisWeekRooms,
      views: thisWeekViews,
      growth: {
        users: calcGrowth(thisWeekUsers, lastWeekUsers),
        rooms: calcGrowth(thisWeekRooms, lastWeekRooms),
        views: calcGrowth(thisWeekViews, lastWeekViews)
      }
    }
  } catch (error) {
    throw error
  }
}

const getDailyStats = async () => {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 7)

    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)

    const daily = await RoomModel.countDocuments({ createdAt: { $gte: today } })
    const weekly = await RoomModel.countDocuments({ createdAt: { $gte: sevenDaysAgo } })
    const monthly = await RoomModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })

    return {
      daily,
      weekly,
      monthly
    }
  } catch (error) {
    throw error
  }
}

const getPopularStats = async () => {
  try {
    const popularRooms = await RoomModel.find({ status: 'approved' })
      .sort({ avgRating: -1, totalRatings: -1, totalLikes: -1 })
      .limit(5)
      .select('name avgRating totalRatings totalLikes viewCount')

    return {
      popularRooms
    }
  } catch (error) {
    throw error
  }
}

const getFilteredReviews = async (paging, query) => {
  try {
    const { page, limit } = paging

    const reviews = await ReviewModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })

    const total = await ReviewModel.countDocuments()

    return {
      reviews,
      total,
      page,
      limit
    }
  } catch (error) {
    throw error
  }
}

const deleteReview = async (id) => {
  try {
    const deletedReview = await ReviewModel.findByIdAndDelete(id)
    await deletedReview.updateRoomAvgRating()
    return deletedReview
  } catch (error) {
    throw error
  }
}
const getTopViewedRooms = async () => {
  try {
    const topRooms = await RoomModel.find({ status: 'approved' })
      .sort({ viewCount: -1 })
      .limit(6)
      .select('name address images avgRating viewCount');
    return topRooms
  } catch (error) {
    throw error
  }
}
const getUserMonthlyStats = async () => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const thisMonth = await UserModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: { $dayOfMonth: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ])

    const lastMonth = await UserModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        }
      },
      {
        $group: {
          _id: { $dayOfMonth: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ])

    return { thisMonth, lastMonth }
  } catch (error) {
    throw error
  }
}
const hideReview = async (id) => {
  try {
    const review = await ReviewModel.findByIdAndUpdate(id, { _hidden: true }, { new: true })
    return review
  } catch (error) {
    throw error
  }
}

const getTopHosts = async () => {
  const topHosts = await RoomModel.aggregate([
    { $match: { status: 'approved' } },

    {
      $group: {
        _id: '$createdBy',
        totalRooms: { $sum: 1 },
        totalLikes: { $sum: '$totalLikes' },
        totalViews: { $sum: '$viewCount' }
      }
    },

    {
      $addFields: {
        activityScore: {
          $add: [
            { $multiply: ['$totalRooms', 1] },
            { $multiply: ['$totalLikes', 0.5] },
            { $multiply: ['$totalViews', 0.2] }
          ]
        }
      }
    },

    { $sort: { activityScore: -1 } },
    { $limit: 5 },

    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'host'
      }
    },
    { $unwind: '$host' },

    // Chọn field trả về
    {
      $project: {
        _id: 0,
        userId: '$host._id',
        fullName: { $concat: ['$host.firstName', ' ', '$host.lastName'] },
        firstName: '$host.firstName',
        lastName: '$host.lastName',
        avatar: '$host.avatar',
        totalRooms: 1,
        totalLikes: 1,
        totalViews: 1,
        activityScore: 1
      }
    }
  ])

  return topHosts
}



export const adminService = {
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
  getTopHosts
}
