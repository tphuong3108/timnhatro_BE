import { StatusCodes } from 'http-status-codes'
import { get } from 'mongoose'
import { roomService } from '~/services/room.service.js'

const createNew = async (req, res, next) => {
  try {
    const userId = req.user.id
    const role = req.user.role
    const images = req.files['images']?.map(f => f.path) || []
    const videos = req.files['videos']?.map(f => f.path) || []
    const newRoom = await roomService.createNew({
      ...req.body,
      images,
      videos
    }, userId, role === 'admin' ? userId : null)
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

const getAllRoomsForAdmin = async (req, res, next) => {
  try {
    const roomList = await roomService.getAllRoomsForAdmin(req.query)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Room list retrieved successfully (Admin)',
      data: roomList
    })
  } catch (error) {
    next(error)
  }
}

const getHostRooms = async (req, res, next) => {
  try {
    const hostId = req.user.id
    const rooms = await roomService.getHostRooms(hostId, req.query)
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Danh sách phòng của host đã được lấy thành công',
      data: rooms
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

const getRoomDetailsBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params
    const roomDetails = await roomService.getRoomDetailsBySlug(slug)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Lấy chi tiết phòng thành công',
      data: roomDetails
    })
  } catch (error) {
    next(error)
  }
}

const updateRoom = async (req, res, next) => {
  try {
    const roomId = req.params.id
    const userId = req.user.id
    const role = req.user.role

    const images = req.files['images']?.map(f => f.path) || []
    const videos = req.files['videos']?.map(f => f.path) || []

    const updatedRoom = await roomService.updateRoom(roomId, {
      ...req.body,
      ...(images.length && { images }),
      ...(videos.length && { videos })
    }, userId, role)

    res.status(StatusCodes.OK).json({
      message: 'Đã cập nhật phòng thành công',
      data: updatedRoom
    })
  } catch (error) {
    next(error)
  }
}

const updateAvailability = async (req, res, next) => {
  try {
    const { id } = req.params
    const { availability } = req.body
    const userId = req.user?.id
    const role = req.user?.role

    const room = await roomService.updateAvailability(id, availability, userId, role)
    res.status(StatusCodes.OK).json({
      message: 'Room availability updated successfully',
      room
    })
  } catch (error) {
    next(error)
  }
}

const destroyRoom = async (req, res, next) => {
  try {
    const roomId = req.params.id
    const userId = req.user.id
    const role = req.user.role

    await roomService.destroyRoom(roomId, userId, role)

    res.status(StatusCodes.OK).json({
      success: true,
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
    const { status } = req.body // 'approved' hoặc 'rejected'

    const updatedRoom = await roomService.approveRoom(roomId, adminId, status)

    res.status(StatusCodes.OK).json({
      message: `Phòng đã được ${status === 'approved' ? 'phê duyệt' : 'từ chối'} thành công`,
      data: updatedRoom
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

const reportRoom = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const { reason } = req.body

    const result = await roomService.reportRoom(id, userId, reason)
    res.status(StatusCodes.OK).json({ success: true, message: result.message })
  } catch (error) {
    next(error)
  }
}

const getRoomsByWard = async (req, res, next) => {
  try {
    const { wardId } = req.params
    const rooms = await roomService.getRoomsByWard(wardId)
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Lấy danh sách phòng theo phường/xã thành công',
      data: rooms
    })
  } catch (error) {
    next(error)
  }
}

export const roomController = {
  createNew,
  getAllRooms,
  getAllRoomsForAdmin,
  getHostRooms,
  getApprovedRooms,
  searchRooms,
  getRoomDetails,
  getRoomDetailsBySlug,
  updateRoom,
  updateAvailability,
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
  getHotRooms,
  reportRoom,
  getRoomsByWard
}