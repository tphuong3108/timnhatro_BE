import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { mongoose } from 'mongoose'
import RoomModel from '~/models/Room.model.js'
import UserModel from '~/models/User.model.js'
import CheckinModel from '~/models/Checkin.model.js'
import ReviewModel from '~/models/Review.model.js'

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
        path: 'categories',
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
        path: 'categories',
        select: 'name icon'
      })
      .populate({
        path: 'ward',
        select: 'name'
      })
      .sort({ [sortByMapping[sortBy]]: sortOrder })
      .skip(startIndex)
      .limit(limit)
      .select('name slug category address location avgRating images')
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
        path: 'categories',
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

const getRoomDetails = async (roomId) => {
  try {
    const query = await queryGenerate(roomId);
    const room = await RoomModel.find({ ...query, status: 'approved' })
      .populate({
        path: 'categories',
        select: 'name icon description'
      })
      .populate({
        path: 'likeBy',
        select: 'firstName lastName avatar'
      })
      .populate({
        path: 'ward',
        select: 'name'
      })
      .select(
        'categories status name slug description address district ward location avgRating totalRatings totalLikes likeBy images'
      );

    const returnRoom = room[0] || null;
    if (!returnRoom || returnRoom.status !== 'approved') {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Room not found');
    }

    // Lấy danh sách đánh giá của địa điểm
    const reviews = await ReviewModel.find({ roomId: returnRoom._id, _hidden: false })
      .populate('userId', 'name avatar') // Lấy thông tin người dùng
      .select('comment rating createdAt') // Chọn các trường cần thiết
      .sort({ createdAt: -1 });

    return {
      ...returnRoom.toObject(),
      reviews // Thêm danh sách đánh giá vào kết quả trả về
    };
  } catch (error) {
    throw error;
  }
};

const updateRoom = async (roomId, updateData) => {
  try {
    const updatedRoom = await RoomModel.findByIdAndUpdate(roomId, {
      ...updateData,
      updatedAt: new Date()
    }, { new: true })
    if (!updatedRoom) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Room not found')
    }
    return updatedRoom
  }
  catch (error) {
    throw error
  }
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
    if (room.likeBy.includes(new mongoose.Types.ObjectId(userId))) {
      room.likeBy.pull(new mongoose.Types.ObjectId(userId))
    } else {
      room.likeBy.push(new mongoose.Types.ObjectId(userId))
    }
    await room.save()
    await room.updateTotalLikes()
    return room
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
        path: 'categories',
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

const getUserCheckins = async (userId) => {
  try {
    const checkins = await CheckinModel.find({ userId })
      .populate({
        path: 'roomId',
        select: 'name address ward district avgRating totalRatings images',
        populate: {
          path: 'ward',
          select: 'name'
        }
      });
    return checkins;
  } catch (error) {
    throw error;
  }
};


const searchRooms = async (filterCriteria) => {
  try {
    const query = {}
    if (filterCriteria.name) {
      query.name = { $regex: filterCriteria.name, $options: 'i' } // Case-insensitive search
    }
    if (filterCriteria.category) {
      const category = await CategoryModel.findOne({ $or: [{ slug: filterCriteria.category }, { _id: filterCriteria.category }] }).select('_id')
      if (category) {
        query.categories = category._id
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
        path: 'categories',
        select: 'name icon'
      })
      .select('name slug address avgRating totalRatings categories location images')
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
        path: 'categories',
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
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const hotRooms = await CheckinModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lte: now }
        }
      },
      {
        $group: {
          _id: '$roomId',
          totalCheckins: { $sum: 1 }
        }
      },
      { $sort: { totalCheckins: -1 } },
      {
        $lookup: {
          from: 'rooms', // tên collection
          localField: '_id',
          foreignField: '_id',
          as: 'room'
        }
      },
      { $unwind: '$room' },
      {
        $project: {
          _id: 0,
          roomId: '$_id',
          totalCheckins: 1,
          name: '$room.name',
          address: '$room.address',
          image: { $arrayElemAt: ['$room.images', 0] }
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
  getApprovedRooms,
  searchRooms,
  getRoomsMapdata,
  getUserSuggestedRooms,
  getAdminRoomDetails,
  getRoomDetails,
  updateRoom,
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

