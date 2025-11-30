import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import NotificationModel from '~/models/Notification.model.js'

/**
 * Tạo thông báo mới
 * - Dùng cho tenant, host, hoặc admin (admin dùng userId = null)
 */
const createNew = async (data) => {
  try {
    const newNotification = await NotificationModel.create({ ...data })
    return newNotification
  } catch (error) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message)
  }
}

/**
 * Lấy thông báo của 1 user (tenant, host)
 */
const getNotificationsByUser = async (userId) => {
  try {
    const notifications = await NotificationModel.find({
      userId,
      isDeleted: false
    }).sort({ createdAt: -1 })

    return notifications
  } catch (error) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message)
  }
}

/**
 * Lấy thông báo chung cho admin
 * userId = null → thông báo dùng chung
 */
const getNotificationsForAdmin = async () => {
  try {
    const notifications = await NotificationModel.find({
      userId: null,
      role: 'admin',
      isDeleted: false
    }).sort({ createdAt: -1 })

    return notifications
  } catch (error) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message)
  }
}

/**
 * Đánh dấu thông báo đã đọc
 */
const markAsRead = async (notificationId) => {
  try {
    const noti = await NotificationModel.findById(notificationId)

    if (!noti || noti.isDeleted) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found')
    }

    noti.isRead = true
    await noti.save()

    return noti
  } catch (error) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message)
  }
}

/**
 * xóa mềm thông báo
 */
const deleteNotification = async (notificationId) => {
  try {
    const noti = await NotificationModel.findById(notificationId)
    if (!noti || noti.isDeleted) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found')
    }

    noti.isDeleted = true
    await noti.save()

    return noti
  } catch (error) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message)
  }
}

export const notificationService = {
  createNew,
  getNotificationsByUser,
  getNotificationsForAdmin,
  markAsRead,
  deleteNotification
}
