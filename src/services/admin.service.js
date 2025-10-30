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
      .select('name slug images price avgRating totalRatings totalLikes viewCount')

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
      .select('name slug address images price avgRating totalRatings totalLikes viewCount');
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

const getReportsStats = async () => {
  try {
    const reportedRooms = await RoomModel.aggregate([
      { $match: { "reports.0": { $exists: true } } },
      { $unwind: "$reports" },

      {
        $lookup: {
          from: "users",
          localField: "reports.userId",
          foreignField: "_id",
          as: "reportUser",
        },
      },
      { $unwind: { path: "$reportUser", preserveNullAndEmptyArrays: true } },

      // Join chủ trọ
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "hostInfo",
        },
      },
      { $unwind: { path: "$hostInfo", preserveNullAndEmptyArrays: true } },

      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          slug: { $first: "$slug" },
          address: { $first: "$address" },
          images: { $first: "$images" },
          avgRating: { $first: "$avgRating" },
          totalLikes: { $first: "$totalLikes" },
          totalRatings: { $first: "$totalRatings" },
          hostName: {
            $first: {
              $ifNull: [
                "$hostInfo.fullName",
                { $concat: ["$hostInfo.firstName", " ", "$hostInfo.lastName"] },
              ],
            },
          },
          hostAvatar: { $first: "$hostInfo.avatar" },
          totalReports: { $sum: 1 },
          reports: {
            $push: {
              reason: "$reports.reason",
              reportedAt: "$reports.reportedAt",
              reporterName: {
                $ifNull: [
                  "$reportUser.fullName",
                  {
                    $concat: [
                      "$reportUser.firstName",
                      " ",
                      "$reportUser.lastName",
                    ],
                  },
                ],
              },
              reporterAvatar: "$reportUser.avatar",
              reporterEmail: "$reportUser.email",
            },
          },
        },
      },
      { $sort: { totalReports: -1 } },
    ]);

    //  Báo cáo đánh giá 
    const reportedReviews = await ReviewModel.aggregate([
      { $match: { "reports.0": { $exists: true } } },
      { $unwind: "$reports" },

      // Join người báo cáo
      {
        $lookup: {
          from: "users",
          localField: "reports.userId",
          foreignField: "_id",
          as: "reportUser",
        },
      },
      { $unwind: { path: "$reportUser", preserveNullAndEmptyArrays: true } },

      // Join người viết review
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "reviewerInfo",
        },
      },
      { $unwind: { path: "$reviewerInfo", preserveNullAndEmptyArrays: true } },

      // Join phòng chứa review
      {
        $lookup: {
          from: "rooms",
          localField: "roomId",
          foreignField: "_id",
          as: "roomInfo",
        },
      },
      { $unwind: { path: "$roomInfo", preserveNullAndEmptyArrays: true } },

      // Join chủ trọ
      {
        $lookup: {
          from: "users",
          localField: "roomInfo.createdBy",
          foreignField: "_id",
          as: "hostInfo",
        },
      },
      { $unwind: { path: "$hostInfo", preserveNullAndEmptyArrays: true } },

      {
        $group: {
          _id: "$_id",
          roomId: { $first: "$roomId" },
          roomSlug: { $first: "$roomInfo.slug" },
          roomName: { $first: "$roomInfo.name" },
          comment: { $first: "$comment" },
          avgRating: { $first: "$roomInfo.avgRating" },
          totalReports: { $sum: 1 },
          reviewerName: {
            $first: {
              $ifNull: [
                "$reviewerInfo.fullName",
                {
                  $concat: [
                    "$reviewerInfo.firstName",
                    " ",
                    "$reviewerInfo.lastName",
                  ],
                },
              ],
            },
          },
          reviewerAvatar: { $first: "$reviewerInfo.avatar" },
          hostName: {
            $first: {
              $ifNull: [
                "$hostInfo.fullName",
                {
                  $concat: ["$hostInfo.firstName", " ", "$hostInfo.lastName"],
                },
              ],
            },
          },
          hostAvatar: { $first: "$hostInfo.avatar" },
          reports: {
            $push: {
              reason: "$reports.reason",
              reportedAt: "$reports.reportedAt",
              reporterName: {
                $ifNull: [
                  "$reportUser.fullName",
                  {
                    $concat: [
                      "$reportUser.firstName",
                      " ",
                      "$reportUser.lastName",
                    ],
                  },
                ],
              },
              reporterAvatar: "$reportUser.avatar",
              reporterEmail: "$reportUser.email",
            },
          },
        },
      },
      { $sort: { totalReports: -1 } },
    ]);

    return { reportedRooms, reportedReviews };
  } catch (error) {
    throw error;
  }
};


const handleReports = async () => {
  try {
    // ===== Phòng =====
    const reportedRooms = await RoomModel.aggregate([
      { $unwind: "$reports" },
      { $group: { 
          _id: "$_id", 
          createdBy: { $first: "$createdBy" },
          name: { $first: "$name" },
          totalReports: { $sum: 1 }
        } 
      },
      { $sort: { totalReports: -1 } }
    ]);

    const topRooms = reportedRooms.slice(0, 5).map(r => ({
      roomId: r._id,
      name: r.name,
      totalReports: r.totalReports
    }));

    for (const room of reportedRooms) {
      if (room.totalReports >= 5) {
        await RoomModel.findByIdAndUpdate(room._id, { status: "hidden" });
      }
      if (room.totalReports >= 10) {
        await UserModel.findByIdAndUpdate(room.createdBy, { banned: true });
      }
    }

    // ===== Review =====
    const reportedReviews = await ReviewModel.aggregate([
    { $match: { "reports.0": { $exists: true } } },
    { $unwind: "$reports" },
    {
      $addFields: {
        roomId: {
          $cond: [
            { $eq: [{ $type: "$roomId" }, "string"] },
            { $toObjectId: "$roomId" },
            "$roomId"
          ]
        }
      }
    },
      { $group: { 
          _id: "$_id", 
          userId: { $first: "$userId" }, 
          comment: { $first: "$comment" },
          totalReports: { $sum: 1 } 
        } 
      },
      { $sort: { totalReports: -1 } }
    ]);

    const topReviews = reportedReviews.slice(0, 5).map(r => ({
      reviewId: r._id,
      comment: r.comment,
      totalReports: r.totalReports
    }));

    for (const review of reportedReviews) {
      if (review.totalReports >= 5) {
        await ReviewModel.findByIdAndUpdate(review._id, { _hidden: true });
      }
      if (review.totalReports >= 10) {
        await UserModel.findByIdAndUpdate(review.userId, { banned: true });
      }
    }

    return {
      success: true,
      message: "Đã xử lý report thành công",
      topRooms,
      topReviews
    };
  } catch (error) {
    throw error;
  }
}

const getTopAmenities = async () => {
  try {
    const topAmenities = await RoomModel.aggregate([
      { $match: { status: 'approved' } },
      { $unwind: '$amenities' },
      {
        $group: {
          _id: '$amenities',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'amenities',
          localField: '_id',
          foreignField: '_id',
          as: 'amenity'
        }
      },
      { $unwind: '$amenity' },
      {
        $project: {
          _id: 0,
          id: '$_id',
          name: '$amenity.name',
          icon: '$amenity.icon',
          usageCount: '$count'
        }
      }
    ])

    return topAmenities
  } catch (error) {
    throw error
  }
}


const getTopWards = async () => {
  try {
    const topWards = await RoomModel.aggregate([
      { $match: { status: 'approved', isDeleted: false } },
      {
        $group: {
          _id: '$ward',
          totalRooms: { $sum: 1 }
        }
      },
      { $sort: { totalRooms: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'wards',
          localField: '_id',
          foreignField: '_id',
          as: 'wardInfo'
        }
      },
      { $unwind: '$wardInfo' },
      {
        $project: {
          _id: 0,
          wardId: '$wardInfo._id',
          wardName: '$wardInfo.name',
          totalRooms: 1
        }
      }
    ])

    return topWards
  } catch (error) {
    throw error
  }
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
  getTopHosts,
  getReportsStats,
  handleReports,
  getTopAmenities,
  getTopWards,
  
}
