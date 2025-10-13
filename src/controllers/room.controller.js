import { StatusCodes } from 'http-status-codes'
import { roomService } from '~/services/room.service.js'

const createNew = async (req, res, next) => {
  try {
    const userId = req.user.id
    const role = req.user.role
    const newRoom = await roomService.createNew(
      req.body,
      userId,
      role === 'admin' ? userId : null
    )
    res.status(StatusCodes.CREATED).json({
      message: 'Room created successfully',
      data: newRoom
    })
  } catch (error) {
    next(error)
  }
}

const getAllRooms = async (req, res, next) => {
  try {
    const roomList = await roomService.getAllRooms(req.query)
    res.status(StatusCodes.OK).json({
      message: 'Room list retrieved successfully',
      data: roomList
    })
  } catch (error) {
    next(error)
  }
}

const getApprovedRooms = async (req, res, next) => {
  try {
    const approvedRooms = await roomService.getApprovedRooms(req.query)
    res.status(StatusCodes.OK).json({ success: true, data: approvedRooms })
  } catch (error) {
    next(error)
  }
}

const getRoomsMapdata = async (req, res, next) => {
  try {
    const mapData = await roomService.getRoomsMapdata(req.query)
    res.status(StatusCodes.OK).json({
      success: true,
      data: mapData
    })
  } catch (error) {
    next(error)
  }
}

const getRoomDetails = async (req, res, next) => {
  try {
    const roomId = req.params.id
    const roomDetails = await roomService.getRoomDetails(roomId)
    res.status(StatusCodes.OK).json({
      success: true,
      data: roomDetails
    })
  } catch (error) {
    next(error)
  }
}

const updateRoom = async (req, res, next) => {
  try {
    const roomId = req.params.id
    const updatedRoom = await roomService.updateRoom(roomId, req.body)
    res.status(StatusCodes.OK).json({
      message: 'Đã cập nhật phòng thành công',
      data: updatedRoom
    })
  } catch (error) {
    next(error)
  }
}

const destroyRoom = async (req, res, next) => {
  try {
    const roomId = req.params.id
    await roomService.destroyRoom(roomId)
    res.status(StatusCodes.OK).json({
      message: 'Đã xóa phòng thành công'
    })
  } catch (error) {
    next(error)
  }
}

const addViewCount = async (req, res, next) => {
  try {
    const roomId = req.params.id
    const room = await roomService.addViewCount(roomId)
    res.status(StatusCodes.OK).json({
      'success': true,
      message: 'Đã tăng view count thành công',
      room
    })
  } catch (error) {
    next(error)
  }
}

const likeRoom = async (req, res, next) => {
  try {
    const roomId = req.params.id
    const userId = req.user.id
    const { isLiked } = await roomService.likeRoom(roomId, userId)
    res.status(StatusCodes.OK).json({
      success: true,
      message: isLiked
        ? 'Đã thích phòng thành công'
        : 'Đã bỏ thích phòng thành công'
    })
  } catch (error) {
    next(error)
  }
}

const addToFavorites = async (req, res, next) => {
  try {
    const roomId = req.params.id
    const userId = req.user.id
    const user = await roomService.addToFavorites(roomId, userId)
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Đã thêm phòng vào yêu thích thành công',
      user
    })
  } catch (error) {
    next(error)
  }
}

const removeFromFavorites = async (req, res, next) => {
  try {
    const roomId = req.params.id
    const userId = req.user.id
    const user = await roomService.removeFromFavorites(roomId, userId)
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Đã xóa phòng khỏi yêu thích thành công',
      user
    })
  } catch (error) {
    next(error)
  }
}

const updateRoomCoordinates = async (req, res, next) => {
  try {
    const roomId = req.params.id
    // const coordinates = req.body.coordinates
    // const updatedRoom = await roomService.updateRoomCoordinates(roomId, coordinates)
    const { latitude, longitude } = req.body
    const updatedRoom = await roomService.updateRoomCoordinates(roomId, latitude, longitude)
    res.status(StatusCodes.OK).json({
      message: 'Đã cập nhật tọa độ phòng thành công',
      data: updatedRoom
    })
  } catch (error) {
    next(error)
  }
}

const approveRoom = async (req, res, next) => {
  try {
    const roomId = req.params.id
    const adminId = req.user.id
    const approvedRoom = await roomService.approveRoom(roomId, adminId)
    res.status(StatusCodes.OK).json({
      message: 'Phòng đã được phê duyệt thành công',
      data: approvedRoom
    })
  } catch (error) {
    next(error)
  }
}

const getAdminRoomDetails = async (req, res, next) => {
  try {
    const roomId = req.params.id
    const roomDetails = await roomService.getAdminRoomDetails(roomId)
    res.status(StatusCodes.OK).json({ success: true, data: roomDetails })
  } catch (error) {
    next(error)
  }
}

const getNearbyRooms = async (req, res, next) => {
  try {
    const nearbyRooms = await roomService.getNearbyRooms(req.query)
    res.status(StatusCodes.OK).json({
      success: true,
      data: nearbyRooms
    })
  } catch (error) {
    next(error)
  }
}

const searchRooms = async (req, res, next) => {
  try {
    const filteredRooms = await roomService.searchRooms(req.query)
    res.status(StatusCodes.OK).json({
      success: true,
      data: filteredRooms
    })
  } catch (error) {
    next(error)
  }
}

const getHotRooms = async (req, res, next) => {
  try {
    const hotRooms = await roomService.getHotRooms()
    res.status(StatusCodes.OK).json({
      success: true,
      data: hotRooms
    })
  } catch (error) {
    next(error)
  }
}


export const roomController = {
  createNew,
  getAllRooms,
  getApprovedRooms,
  searchRooms,
  getRoomDetails,
  updateRoom,
  destroyRoom,
  addViewCount,
  likeRoom,
  addToFavorites,
  removeFromFavorites,
  updateRoomCoordinates,
  approveRoom,
  getAdminRoomDetails,
  getRoomsMapdata,
  getNearbyRooms,
  getHotRooms
}