import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { mongoose } from 'mongoose'
import RoomModel from '~/models/Room.model.js'
import UserModel from '~/models/User.model.js'
import WardModel from '~/models/Ward.model.js';
import ReviewModel from '~/models/Review.model.js'

import { OBJECT_ID_RULE } from '~/utils/validators'
import AmenityModel from '~/models/Amenity.model.js'
import { notificationService } from './notification.service.js'

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
    // Tạo thông báo cho host về đánh giá mới
    await notificationService.createNew({
      userId: null,
      role: 'admin',
      type: 'room:new',
      referenceId: newRoom._id,
      referenceType: "room",
      title: 'Có phòng mới cần duyệt',
      message: `Một phòng mới vừa được tạo và chờ duyệt: ${newRoom.name}`
    })
    return newRoom
  } catch (error) {
    throw error
  }
}

const updateExpiredPremium = async () => {
  try {
    const now = new Date()
    await RoomModel.updateMany(
      { isPremium: true, premiumUntil: { $lt: now } },
      { isPremium: false, premiumUntil: null }
    )
  } catch (error) {
    console.error('Error updating expired premium rooms:', error)
  }
}

const getApprovedRooms = async (queryParams) => {
  try {
    // Cập nhật phòng hết hạn premium trước khi fetch
    await updateExpiredPremium()

    const sortByMapping = {
      // location: 'location',
      latest: 'createdAt',
      rating: 'avgRating',
      premium: 'isPremium'
    }
    const page = parseInt(queryParams.page, 10) || 1
    const limit = parseInt(queryParams.limit, 10) || 10
    const startIndex = (page - 1) * limit

    const sortBy = queryParams.sortBy || 'latest'

    // Xây dựng sortOrder
    let sortOrder = {}
    if (sortBy === 'premium') {
      // Sắp xếp: premium rooms trước, sau đó theo ngày tạo
      sortOrder = {
        isPremium: -1,
        premiumUntil: -1,
        createdAt: queryParams.sortOrder === 'desc' ? -1 : 1
      }
    } else {
      // Sắp xếp thông thường nhưng vẫn ưu tiên premium trước
      sortOrder = {
        isPremium: -1,
        [sortByMapping[sortBy] || 'createdAt']: queryParams.sortOrder === 'desc' ? -1 : 1
      }
    }

    const rooms = await RoomModel.find({ status: 'approved', isDeleted: false })
      .populate({
        path: 'amenities',
        select: 'name icon'
      })
      .populate({
        path: 'ward',
        select: 'name'
      })
      .sort(sortOrder)
      .skip(startIndex)
      .limit(limit)
      .select('name slug address avgRating images isPremium premiumUntil')

    const total = await RoomModel.countDocuments({ status: 'approved', isDeleted: false })

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
      .populate({
        path: 'createdBy',
        select: 'firstName lastName email avatar'
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
      latest: 'createdAt',
      rating: 'avgRating'
    }

    const page = parseInt(queryParams.page, 10) || 1
    const limit = parseInt(queryParams.limit, 10) || 10
    const startIndex = (page - 1) * limit
    const sortBy = queryParams.sortBy || 'createdAt'
    const sortOrder = queryParams.sortOrder === 'desc' ? -1 : 1

    const filter = {
      status: 'approved',
      isDeleted: false
    }

    const rooms = await RoomModel.find(filter)
      .populate({
        path: 'amenities',
        select: 'name icon'
      })
      .populate({
        path: 'ward',
        select: 'name'
      })
      .populate({
        path: 'createdBy',
        select: 'firstName lastName email avatar'
      })
      .sort({ [sortByMapping[sortBy] || 'createdAt']: sortOrder })
      .skip(startIndex)
      .limit(limit)

    const total = await RoomModel.countDocuments(filter)

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

const getAllRoomsForAdmin = async (queryParams) => {
  try {
    const sortByMapping = {
      latest: 'createdAt',
      rating: 'avgRating'
    }

    const sortBy = queryParams.sortBy || 'createdAt'
    const sortOrder = queryParams.sortOrder === 'desc' ? -1 : 1

    const filter = {
      isDeleted: false
    }

    let roomsQuery = RoomModel.find(filter)
      .populate({ path: 'amenities', select: 'name icon' })
      .populate({ path: 'ward', select: 'name' })
      .sort({ [sortByMapping[sortBy] || 'createdAt']: sortOrder })

    let page, limit
    let pagination = null

    // client truyền page + limit thì mới phân trang
    if (queryParams.page && queryParams.limit) {
      page = parseInt(queryParams.page, 10)
      limit = parseInt(queryParams.limit, 10)
      const startIndex = (page - 1) * limit
      roomsQuery = roomsQuery.skip(startIndex).limit(limit)

      const total = await RoomModel.countDocuments(filter)
      pagination = {
        total,
        limit,
        page,
        totalPages: Math.ceil(total / limit)
      }
    }

    const rooms = await roomsQuery

    return { rooms, pagination }
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
      .populate('userId', 'firstName lastName avatar')
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

const getRoomDetailsBySlug = async (slug, userId) => {
  try {
    const query = { slug, status: 'approved', isDeleted: false };

    const room = await RoomModel.findOneAndUpdate(query, { $inc: { viewCount: 1 } }, { new: true })
      .populate({ path: 'amenities', select: 'name description' })
      .populate({ path: 'likeBy', select: 'firstName lastName avatar' })
      .populate({ path: 'ward', select: 'name' })
      .populate({ path: 'createdBy', select: 'firstName lastName fullName email avatar bio' })
      .select(
        'name slug description price address ward location amenities avgRating totalRatings totalLikes likeBy images videos viewCount status createdBy favorites'
      );

    if (!room) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy phòng.');
    }

    const reviews = await ReviewModel.find({ roomId: room._id, isHidden: { $ne: true } })
      .populate('userId', 'firstName lastName avatar')
      .select('comment rating createdAt')
      .sort({ createdAt: -1 });

    // Nếu có `userId` (người dùng đã đăng nhập), thử lấy thông tin người dùng
    // Nếu không có hoặc không tìm thấy, coi như người xem là anonymous và không đánh dấu isLiked/isFavorited
    let user = null
    if (userId) {
      try {
        user = await UserModel.findById(userId)
      } catch (err) {
        user = null
      }
    }

    const isLiked = user && user._id
      ? room.likeBy.some((u) => u._id.toString() === user._id.toString())
      : false

    const isFavorited = user && user._id
      ? room.favorites.some((fav) => fav.equals(user._id))
      : false

    return {
      ...room.toObject(),
      reviews,
      isLiked,
      isFavorited,
    }
  } catch (error) {
    throw error;
  }
};


const updateRoom = async (roomId, updateData, userId, role) => {
  try {
    const room = await RoomModel.findById(roomId)
    if (!room) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy phòng')

    if (room.isDeleted) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Phòng này đã bị xóa, không thể chỉnh sửa')
    }


    if (room.createdBy.toString() !== userId.toString()) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền sửa phòng này.')
    }

    if (role === 'host') {
      // Nếu là host và phòng đã được duyệt → đổi lại thành pending để admin kiểm duyệt lại
      if (room.status === 'approved') {
        room.status = 'pending'
        room.verifiedBy = null

        // Thông báo cho admin về phòng cần được duyệt lại
        await notificationService.createNew({
          userId: null,
          role: 'admin',
          type: 'room:pending_review',
          referenceId: room._id,
          referenceType: "room",
          title: 'Phòng cần được duyệt lại',
          message: `Host đã cập nhật phòng "${room.name}".`
        })
      }
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

  if (room.createdBy.toString() !== userId.toString()) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You are not allowed to update this room')
  }

  room.availability = availability
  await room.save()

  return room
}

const destroyRoom = async (roomId, userId, role) => {
  try {
    const room = await RoomModel.findById(roomId)
    if (!room) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy phòng')
    }

    if (room.isDeleted) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Phòng này đã bị xóa trước đó')
    }

    if (role === 'host') {
      if (!room.createdBy) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Phòng này chưa có chủ sở hữu hợp lệ')
      }

      if (room.createdBy.toString() !== userId.toString()) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xóa phòng này')
      }
    }

    room.isDeleted = true
    room.updatedAt = new Date()

    await room.save()

    return room
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

      // Tạo thông báo cho host khi có người thích phòng của họ
      await notificationService.createNew({
        userId: room.createdBy,
        role: 'host',
        type: 'room:liked',
        referenceId: room._id,
        referenceType: "room",
        title: 'Phòng của bạn được yêu thích',
        message: `Một tenant đã thích phòng "${room.name}".`
      })
    }
    await room.save()
    await room.updateTotalLikes()
    return { room, isLiked }
  } catch (error) {
    throw error
  }
}

const addToFavorites = async (slug, userId) => {
  const room = await RoomModel.findOne({ slug });
  if (!room) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy phòng');

  // Lấy thông tin người dùng từ userId
  const user = await UserModel.findById(userId);
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng');

  // Kiểm tra nếu người dùng chưa yêu thích phòng
  const isAlreadyFavorited = room.favorites.some(favorite => favorite.equals(userId));

  if (!isAlreadyFavorited) {
    // Nếu chưa, thêm phòng vào danh sách yêu thích của người dùng và phòng
    user.favorites.push(room._id);
    room.favorites.push(user._id);

    await user.save();
    await room.save();
  }

  // Trả về phòng cập nhật với danh sách yêu thích mới
  const updatedRoom = await RoomModel.findOne({ slug })
    .populate('favorites')
    .select('favorites');

  return { message: 'Đã thêm phòng vào yêu thích thành công', updatedRoom };
};


const removeFromFavorites = async (slug, userId) => {
  const room = await RoomModel.findOne({ slug });
  if (!room) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy phòng');

  const user = await UserModel.findById(userId);
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng');

  user.favorites = user.favorites.filter((id) => id.toString() !== room._id.toString());
  await user.save();

  room.favorites = room.favorites.filter((id) => id.toString() !== userId.toString());
  await room.save();

  return { message: 'Đã xóa phòng khỏi yêu thích', room };
};


const getFavoriteRooms = async (userId) => {
  try {
    const user = await UserModel.findById(userId)
      .populate({
        path: 'favorites',
        select: 'name slug address price images videos avgRating',
      })
      .lean();

    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }

    return user.favorites;
  } catch (error) {
    throw error;
  }
};


const approveRoom = async (roomId, adminId, status) => {
  const validStatuses = ['approved', 'rejected']

  if (!validStatuses.includes(status)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Trạng thái không hợp lệ (chỉ cho phép approved hoặc rejected).')
  }

  const room = await RoomModel.findById(roomId)
  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy địa điểm.')
  }

  if (room.status !== 'pending') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Chỉ có thể phê duyệt hoặc từ chối phòng đang ở trạng thái pending.')
  }

  room.status = status
  room.verifiedBy = adminId

  await room.save()

  // Tạo thông báo cho host về kết quả phê duyệt
  await notificationService.createNew({
    userId: room.createdBy,
    role: 'host',
    type: status === 'approved' ? 'room:approved' : 'room:rejected',
    referenceId: room._id,
    referenceType: "room",
    title: status === 'approved' ? 'Phòng đã được duyệt' : 'Phòng bị từ chối',
    message: `Phòng "${room.name}" đã được cập nhật trạng thái: ${status}.`
  })
  return room
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
    const query = {};

    // Tìm kiếm theo tên phòng
    if (filterCriteria.name) {
      query.name = { $regex: filterCriteria.name, $options: 'i' };
    }

    // Tìm kiếm theo amenity (tiện nghi) - hỗ trợ cả ObjectID và tên
    if (filterCriteria.amenity) {
      const amenities = Array.isArray(filterCriteria.amenity)
        ? filterCriteria.amenity
        : filterCriteria.amenity.split(',');
      
      const amenityIds = [];
      
      for (const amenity of amenities) {
        const trimmed = amenity.trim();
        // Kiểm tra nếu là ObjectID hợp lệ (24 ký tự hex)
        if (/^[0-9a-fA-F]{24}$/.test(trimmed)) {
          // Là ObjectID - sử dụng trực tiếp
          amenityIds.push(new mongoose.Types.ObjectId(trimmed));
        } else {
          // Là tên - tìm trong database
          const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const amenityDoc = await AmenityModel.findOne({
            name: { $regex: new RegExp(escapeRegex(trimmed), 'i') }
          }).select('_id');
          if (amenityDoc) {
            amenityIds.push(amenityDoc._id);
          }
        }
      }
      
      if (amenityIds.length > 0) {
        query.amenities = { $in: amenityIds };
      } else {
        // Không tìm thấy tiện nghi phù hợp - trả về mảng rỗng
        return [];
      }
    }

    // Tìm kiếm theo địa chỉ - tìm trong cả name, address VÀ ward.name
    if (filterCriteria.address) {
      const searchTerm = filterCriteria.address.trim();
      
      // Tìm các ward có tên khớp với từ khóa
      const matchingWards = await WardModel.find({ 
        name: { $regex: searchTerm, $options: 'i' } 
      }).select('_id');
      
      // Tạo điều kiện $or để tìm trong name, address, hoặc ward
      const orConditions = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { address: { $regex: searchTerm, $options: 'i' } }
      ];
      
      if (matchingWards.length > 0) {
        orConditions.push({ ward: { $in: matchingWards.map(w => w._id) } });
      }
      
      query.$or = orConditions;
    }

    // Tìm kiếm theo phường/xã - hỗ trợ cả ObjectID và tên
    if (filterCriteria.ward) {
      const wardValue = filterCriteria.ward.trim();
      
      // Kiểm tra nếu là ObjectID hợp lệ (24 ký tự hex)
      if (/^[0-9a-fA-F]{24}$/.test(wardValue)) {
        // Là ObjectID - sử dụng trực tiếp
        query.ward = new mongoose.Types.ObjectId(wardValue);
      } else {
        // Là tên - tìm trong database
        const wards = await WardModel.find({ name: { $regex: wardValue, $options: 'i' } }).select('_id');
        if (wards.length > 0) {
          query.ward = { $in: wards.map(w => w._id) };
        } else {
          return [];
        }
      }
    }

    // Tìm kiếm theo khoảng giá
    if (filterCriteria.minPrice || filterCriteria.maxPrice) {
      query.price = {};
      if (filterCriteria.minPrice)
        query.price.$gte = parseInt(filterCriteria.minPrice);
      if (filterCriteria.maxPrice)
        query.price.$lte = parseInt(filterCriteria.maxPrice);
    }

    // Tìm kiếm theo số sao (avgRating)
    if (filterCriteria.avgRating) {
      query.avgRating = { $gte: parseFloat(filterCriteria.avgRating) };
    }

    // Tìm kiếm theo tổng số đánh giá
    if (filterCriteria.totalRatings) {
      query.totalRatings = { $gte: parseInt(filterCriteria.totalRatings) };
    }

    const rooms = await RoomModel.find({
      ...query,
      status: 'approved',
      isDeleted: false
    })
      .populate({ path: 'amenities', select: 'name icon' })
      .populate({ path: 'ward', select: 'name' })
      .select('name slug address price avgRating totalRatings amenities location images')
      .limit(50);

    return rooms;
  } catch (error) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
}
const getNearbyRooms = async (queryParams) => {
  try {
    const { latitude, longitude, distance } = queryParams;

    const rooms = await RoomModel.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          distanceField: "distance",
          spherical: true,
          maxDistance: parseInt(distance),
        },
      },
      {
        $match: { status: "approved" },
      },
      {
        $lookup: {
          from: "amenities",
          localField: "amenities",
          foreignField: "_id",
          as: "amenities",
        },
      },
      {
        $project: {
          name: 1,
          slug: 1,
          address: 1,
          avgRating: 1,
          totalRatings: 1,
          totalLikes: 1,
          viewCount: 1,
          images: 1,
          location: 1,
          distance: 1,
          amenities: { name: 1, icon: 1 },
        },
      },
      { $limit: 20 },
    ]);

    return rooms;
  } catch (error) {
    throw error;
  }
};

const getHotRooms = async () => {
  try {
    const LIMIT = 20;
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay(); // 0 = Chủ nhật
    startOfWeek.setDate(now.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);

    // phòng nổi bật trong tuần
    const weeklyRooms = await RoomModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfWeek, $lte: now },
          status: "approved",
          availability: "available",
          isDeleted: false
        }
      },
      {
        $addFields: {
          favoriteCount: { $size: { $ifNull: ["$favorites", []] } },
          hotScore: {
            $add: [
              { $multiply: [{ $ifNull: ["$avgRating", 0] }, 10] },
              { $multiply: [{ $ifNull: ["$totalLikes", 0] }, 2] },
              { $ifNull: ["$viewCount", 0] }
            ]
          }
        }
      },
      {
        $sort: {
          hotScore: -1,
          avgRating: -1,
          totalLikes: -1,
          viewCount: -1
        }
      },
      {
        $project: {
          _id: 0,
          roomId: "$_id",
          name: 1,
          address: 1,
          slug: 1,
          image: { $arrayElemAt: ["$images", 0] },
          hotScore: 1,
          avgRating: 1,
          favoriteCount: 1,
          totalLikes: 1,
          viewCount: 1
        }
      },
      { $limit: LIMIT }
    ]);

    if (weeklyRooms.length >= LIMIT) return weeklyRooms; // Nếu có dữ liệu thỏa -> trả về luôn

    const needed = LIMIT - weeklyRooms.length;
    // Lấy top phòng có like + view cao nhất nếu không có phòng nổi bật
    let fallbackRooms = await RoomModel.aggregate([
      {
        $match: {
          status: "approved",
          availability: "available",
          isDeleted: false,
          _id: { $nin: weeklyRooms.map(r => r.roomId) } // tránh trùng bài
        }
      },
      {
        $addFields: {
          favoriteCount: { $size: { $ifNull: ["$favorites", []] } },
          hotScore: {
            $add: [
              { $multiply: [{ $ifNull: ["$avgRating", 0] }, 10] },
              { $multiply: [{ $ifNull: ["$totalLikes", 0] }, 2] },
              { $ifNull: ["$viewCount", 0] }
            ]
          }
        }
      },
      {
        $sort: {
          hotScore: -1,
          avgRating: -1,
          totalLikes: -1,
          viewCount: -1
        }
      },
      {
        $project: {
          _id: 0,
          roomId: "$_id",
          name: 1,
          address: 1,
          slug: 1,
          image: { $arrayElemAt: ["$images", 0] },
          hotScore: 1,
          avgRating: 1,
          favoriteCount: 1,
          totalLikes: 1,
          viewCount: 1
        }
      },
      { $limit: needed }
    ]);

    return [...weeklyRooms, ...fallbackRooms];
  } catch (error) {
    throw error;
  }
};

const reportRoom = async (roomId, userId, reportReason) => {
  try {
    const room = await RoomModel.findById(roomId)
    if (!room) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy phòng.')
    }

    if (room.status !== 'approved' || room.isDeleted) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Chỉ có thể báo cáo phòng đang hoạt động hợp lệ.'
      )
    }

    const alreadyReported = room.reports.some(
      (report) => report.userId.toString() === userId.toString()
    )

    if (alreadyReported) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'Bạn đã báo cáo phòng này rồi.'
      )
    }

    room.reports.push({ userId, reason: reportReason })
    await room.save()

    // Tạo thông báo cho admin về phòng bị báo cáo
    await notificationService.createNew({
      userId: null,
      role: 'admin',
      type: 'room:reported',
      referenceId: room._id,
      referenceType: "room",
      title: 'Có báo cáo mới',
      message: `Phòng "${room.name}" vừa bị báo cáo bởi người dùng.`
    })

    return {
      success: true,
      message: 'Báo cáo đã được gửi thành công.'
    }
  } catch (error) {
    throw error
  }
}

const getPremiumRooms = async (queryParams) => {
  try {
    const page = parseInt(queryParams.page, 10) || 1
    const limit = parseInt(queryParams.limit, 10) || 20
    const startIndex = (page - 1) * limit

    const now = new Date()

    const filter = {
      isPremium: true,
      premiumUntil: { $gt: now },
      status: 'approved',
      isDeleted: false
    }

    const rooms = await RoomModel.find(filter)
      .populate({ path: 'amenities', select: 'name icon' })
      .populate({ path: 'ward', select: 'name' })
      .populate({ path: 'createdBy', select: 'firstName lastName email avatar' })
      .sort({ premiumUntil: -1, createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .select('name slug address price avgRating images isPremium premiumUntil premiumPaymentId')

    const total = await RoomModel.countDocuments(filter)

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

const getRoomsByWard = async (wardId) => {
  try {
    const rooms = await RoomModel.find({
      ward: wardId,
      status: 'approved',
      isDeleted: false
    })
      .populate('ward', 'name') // lấy tên phường/xã
      .populate('amenities', 'name') // lấy tên tiện nghi
      .populate('createdBy', 'firstName lastName email') // thông tin chủ phòng
      .sort({ avgRating: -1, viewCount: -1 }) // sắp xếp theo lượt đánh giá & lượt xem
      .lean()

    return rooms
  } catch (error) {
    throw error
  }
}

const checkPremiumStatus = async (roomId) => {
  try {
    const room = await RoomModel.findById(roomId)
      .select('isPremium premiumUntil')

    if (!room) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy phòng')
    }

    // Kiểm tra nếu premium đã hết hạn
    if (room.isPremium && room.premiumUntil && new Date() > new Date(room.premiumUntil)) {
      room.isPremium = false
      room.premiumUntil = null
      await room.save()
    }

    return room
  } catch (error) {
    throw error
  }
}

export const roomService = {
  createNew,
  getAllRooms,
  getAllRoomsForAdmin,
  getHostRooms,
  getPremiumRooms,
  getApprovedRooms,
  searchRooms,
  getRoomsMapdata,
  addViewCount,
  getUserSuggestedRooms,
  getAdminRoomDetails,
  getRoomDetails,
  getRoomDetailsBySlug,
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
  getHotRooms,
  reportRoom,
  getRoomsByWard,
  updateExpiredPremium,
  checkPremiumStatus,
}

