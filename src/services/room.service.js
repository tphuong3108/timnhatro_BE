import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { mongoose } from 'mongoose'
import RoomModel from '~/models/Room.model.js'
import UserModel from '~/models/User.model.js'

import { OBJECT_ID_RULE } from '~/utils/validators'
import AmenityModel from '~/models/Amenity.model.js'

const queryGenerate = async (id) => {
  if (id.match(OBJECT_ID_RULE)) {
    return { _id: new mongoose.Types.ObjectId(id) }
  }
  return { slug: id }
}


const createNew = async (roomData, userId, ownerId) => {
  try {
    const newRoom = await RoomModel.create({
      ...roomData,
      createdBy: userId,
      verifiedBy: ownerId,
      status: ownerId ? 'approved' : 'pending'
    })
    return newRoom
  } catch (error) {
    throw error
  }
}

const getApprovedRooms = async (queryParams) => {
  try {
    const sortByMapping = {
      // location: 'location',
      latest: 'createdAt',
      rating: 'avgRating'
    }
    const page = parseInt(queryParams.page, 10) || 1
    const limit = parseInt(queryParams.limit, 10) || 10
    const startIndex = (page - 1) * limit

    const sortBy = queryParams.sortBy || 'createdAt'
    const sortOrder = queryParams.sortOrder === 'desc' ? -1 : 1
    const rooms = await RoomModel.find({ status: 'approved' })
      .populate({
        path: 'amenities',
        select: 'name icon'
      })
      .populate({
        path: 'ward',
        select: 'name'
      })
      .sort({ [sortByMapping[sortBy]]: sortOrder })
      .skip(startIndex)
      .limit(limit)
      .select('name slug address avgRating images')

    const total = await RoomModel.countDocuments({ status: 'approved' })

    const returnRooms = {
      rooms,
      pagination: {
        total,
        limit,
        page,
        totalPages: Math.ceil(total / limit)
      }
    }
    return returnRooms
  } catch (error) {
    throw error
  }
}

const getRoomsMapdata = async (queryParams) => {
  try {
    const sortByMapping = {
      // location: 'location',
      latest: 'createdAt',
      rating: 'avgRating'
    }
    const page = parseInt(queryParams.page, 10) || 1
    const limit = parseInt(queryParams.limit, 10) || 10
    const startIndex = (page - 1) * limit

    const sortBy = queryParams.sortBy || 'createdAt'
    const sortOrder = queryParams.sortOrder === 'desc' ? -1 : 1
    const rooms = await RoomModel.find({ status: 'approved' })
      .populate({
        path: 'amenities',
        select: 'name icon'
      })
      .populate({
        path: 'ward',
        select: 'name'
      })
      .sort({ [sortByMapping[sortBy]]: sortOrder })
      .skip(startIndex)
      .limit(limit)
      .select('name slug amenity address location avgRating images')
    const total = await RoomModel.countDocuments({ status: 'approved' })

    const returnRooms = {
      rooms,
      pagination: {
        total,
        limit,
        page,
        totalPages: Math.ceil(total / limit)
      }
    }
    return returnRooms
  } catch (error) {
    throw error
  }
}

const getAllRooms = async (queryParams) => {
  try {
    const sortByMapping = {
      // location: 'location',
      latest: 'createdAt',
      rating: 'avgRating'
    }
    const page = parseInt(queryParams.page, 10) || 1
    const limit = parseInt(queryParams.limit, 10) || 10
    const startIndex = (page - 1) * limit
    const sortBy = queryParams.sortBy || 'createdAt'
    const sortOrder = queryParams.sortOrder === 'desc' ? -1 : 1
    const rooms = await RoomModel.find()
      .populate({
        path: 'amenities',
        select: 'name icon'
      })
      .populate({
        path: 'ward',
        select: 'name'
      })
      .sort({ [sortByMapping[sortBy]]: sortOrder })
      .skip(startIndex)
      .limit(limit)
    const total = await RoomModel.countDocuments()
    return {
      rooms,
      pagination: {
        total,
        limit,
        page,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    throw error
  }
}

const getHostRooms = async (hostId, queryParams) => {
  try {
    const page = parseInt(queryParams.page, 10) || 1
    const limit = parseInt(queryParams.limit, 10) || 10
    const startIndex = (page - 1) * limit

    const rooms = await RoomModel.find({ createdBy: hostId })
      .populate({ path: 'amenities', select: 'name icon' })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .select('name status slug address price avgRating images createdAt')

    const total = await RoomModel.countDocuments({ createdBy: hostId })

    return {
      rooms,
      pagination: {
        total,
        limit,
        page,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    throw error
  }
}

const getRoomDetails = async (roomId) => {
  try {
    const query = await queryGenerate(roomId)

    const room = await RoomModel.findOneAndUpdate(
      { ...query, status: 'approved' },
      { $inc: { viewCount: 1 } },
      { new: true }
    )
      .populate({ path: 'amenities', select: 'name description' })
      .populate({ path: 'likeBy', select: 'firstName lastName avatar' })
      .populate({ path: 'ward', select: 'name' })
      .select(
        'amenities status name slug description price address ward location avgRating totalRatings totalLikes likeBy images viewCount'
      );

    if (!room || room.status !== 'approved') {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Room not found')
    }

    // Lấy danh sách đánh giá
    const reviews = await ReviewModel.find({ roomId: room._id, _hidden: false })
      .populate('userId', 'name avatar')
      .select('comment rating createdAt')
      .sort({ createdAt: -1 })

    return {
      ...room.toObject(),
      reviews
    }
  } catch (error) {
    throw error
  }
}

const updateRoom = async (roomId, updateData, userId, role) => {
  try {
    const room = await RoomModel.findById(roomId)
    if (!room) throw new ApiError(StatusCodes.NOT_FOUND, 'Room not found')

    // Nếu là host và phòng đã được duyệt → chuyển về pending để admin kiểm duyệt lại
    if (role === 'host' && room.status === 'approved') {
      room.status = 'pending'
      room.verifiedBy = null
    }

    Object.assign(room, updateData)
    room.updatedAt = new Date()
    await room.save()
    return room
  } catch (error) {
    throw error
  }
}

const updateAvailability = async (roomId, availability, userId, role) => {
  const room = await RoomModel.findById(roomId)
  if (!room) throw new ApiError(StatusCodes.NOT_FOUND, 'Room not found')

  if (role === 'host' && room.createdBy.toString() !== userId.toString()) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You are not allowed to update this room')
  }

  room.availability = availability
  await room.save()

  return room
}

const destroyRoom = async (roomId) => {
  try {
    return await updateRoom(roomId, { status: 'hidden' })
  } catch (error) {
    throw error
  }
}

const likeRoom = async (roomId, userId) => {
  try {
    const room = await RoomModel.findById(roomId)
    if (!room || room.status !== 'approved') {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Room not found')
    }
    const userObjectId = new mongoose.Types.ObjectId(userId)
    let isLiked
    if (room.likeBy.includes(userObjectId)) {
      room.likeBy.pull(userObjectId)
      isLiked = false   // => Bỏ thích
    } else {
      room.likeBy.push(userObjectId)
      isLiked = true    // => Đã thích
    }
    await room.save()
    await room.updateTotalLikes()
    return { room, isLiked }
  } catch (error) {
    throw error
  }
}

const addToFavorites = async (roomId, userId) => {
  try {
    const user = await UserModel.findById(userId)
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }
    if (user.favorites.includes(roomId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Room already in favorites')
    }
    user.favorites.push(roomId)
    await user.save()
    return user
  } catch (error) {
    throw error
  }
}

const removeFromFavorites = async (roomId, userId) => {
  try {
    const user = await UserModel.findById(userId)
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }
    if (!user.favorites.includes(roomId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Room not in favorites')
    }
    user.favorites.pull(roomId)
    await user.save()
    return user
  } catch (error) {
    throw error
  }
}

const getFavoriteRooms = async (userId) => {
  try {
    const user = await UserModel.findById(userId).populate('favorites')
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }
    return user.favorites
  } catch (error) {
    throw error
  }
}

const approveRoom = async (roomId, adminId) => {
  try {
    const room = await RoomModel.findById(roomId)
    if (!room) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy địa điểm.')
    }
    if (room.status === 'approved') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Địa điểm đã được phê duyệt.')
    }
    room.status = 'approved'
    room.verifiedBy = adminId
    await room.save()
    return room
  } catch (error) {
    throw error
  }
}

const updateRoomCoordinates = async (roomId, latitude, longitude) => {
  try {
    const room = await RoomModel.findById(roomId)
    if (!room) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy địa điểm.')
    }
    room.location.coordinates = [longitude, latitude]
    await room.save()
    return room
  } catch (error) {
    throw error
  }
}

const getAdminRoomDetails = async (roomId) => {
  try {
    const room = await RoomModel.findById(roomId)
      .populate({
        path: 'amenities',
        select: 'name icon description'
      })
      .populate({
        path: 'likeBy',
        select: 'firstName lastName avatar'
      })
      .populate({
        path: 'createdBy',
        select: 'firstName lastName email'
      })
      .populate({
        path: 'verifiedBy',
        select: 'firstName lastName email'
      })
    if (!room) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy địa điểm.')
    }
    return room
  } catch (error) {
    throw error
  }
}

const addViewCount = async (roomId, userId) => {
  try {
    const room = await RoomModel.findById(roomId)
    if (!room || room.status !== 'approved') {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Room not found')
    }
    room.viewCount += 1
    await room.save()
    return room
  } catch (error) {
    throw error
  }
}

const getUserSuggestedRooms = async (userId) => {
  try {
    const suggestedRooms = await RoomModel.find({
      createdBy: userId
    })
    return suggestedRooms
  } catch (error) {
    throw error
  }
}

const searchRooms = async (filterCriteria) => {
  try {
    const query = {}
    if (filterCriteria.name) {
      query.name = { $regex: filterCriteria.name, $options: 'i' } // Case-insensitive search
    }
    if (filterCriteria.amenity) {
      const amenity = await AmenityModel.findOne({ $or: [{ slug: filterCriteria.amenity }, { _id: filterCriteria.amenity }] }).select('_id')
      if (amenity) {
        query.amenities = amenity._id
      }
    }
    if (filterCriteria.address) {
      query.address = { $regex: filterCriteria.address, $options: 'i' } // Case-insensitive search
    }
    if (filterCriteria.district) {
      query.district = { $regex: filterCriteria.district, $options: 'i' } // Case-insensitive search
    }
    if (filterCriteria.ward) {
      query.ward = { $regex: filterCriteria.ward, $options: 'i' } // Case-insensitive search
    }
    if (filterCriteria.avgRating) {
      query.avgRating = { $gte: parseFloat(filterCriteria.avgRating) } // Minimum average rating
    }
    if (filterCriteria.totalRatings) {
      query.totalRatings = { $gte: parseInt(filterCriteria.totalRatings) } // Minimum total ratings
    }
    const rooms = await RoomModel.find({ ...query, status: 'approved' })
      .populate({
        path: 'amenities',
        select: 'name icon'
      })
      .select('name slug address avgRating totalRatings amenities location images')
      .limit(50) // Limit results for performance
    return rooms
  } catch (error) {
    throw error
  }
}

const getNearbyRooms = async (queryParams) => {
  try {
    const { latitude, longitude, distance } = queryParams;
    const rooms = await RoomModel.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(distance)
        }
      },
      status: 'approved'
    })
      .populate({
        path: 'amenities',
        select: 'name icon'
      })
      .select('name slug address avgRating images location')
      .limit(20); // Limit results for performance

    return rooms;
  } catch (error) {
    throw error;
  }
}
const getHotRooms = async () => {
  try {
    const now = new Date()
    const startOfWeek = new Date(now)
    const day = now.getDay() // 0 = Chủ nhật
    startOfWeek.setDate(now.getDate() - day)
    startOfWeek.setHours(0, 0, 0, 0)

    const hotRooms = await RoomModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfWeek, $lte: now }
        }
      },
      {
        $addFields: {
          favoriteCount: { $size: { $ifNull: ['$favorites', []] } }
        }
      },
      {
        // Sắp xếp theo: rating cao → favorite nhiều → like nhiều
        $sort: { avgRating: -1, favoriteCount: -1, totalLikes: -1 }
      },      
      {
        $project: {
          _id: 0,
          roomId: '$_id',
          name: '$name',
          address: '$address',
          image: { $arrayElemAt: ['$images', 0] },
          avgRating: 1,
          favoriteCount: 1,
          totalLikes: 1
        }
      }
    ])

    return hotRooms
  } catch (error) {
    throw error
  }
}

export const roomService = {
  createNew,
  getAllRooms,
  getHostRooms,
  getApprovedRooms,
  searchRooms,
  getRoomsMapdata,
  addViewCount,
  getUserSuggestedRooms,
  getAdminRoomDetails,
  getRoomDetails,
  updateRoom,
  updateAvailability,
  destroyRoom,
  likeRoom,
  addToFavorites,
  removeFromFavorites,
  getFavoriteRooms,
  approveRoom,
  updateRoomCoordinates,
  getNearbyRooms,
  getHotRooms
}

