import { StatusCodes } from 'http-status-codes'
import { notificationService } from '~/services/notification.service.js'

/**
 * Tạo thông báo
 */
const createNotification = async (req, res, next) => {
  try {
    const newNoti = await notificationService.createNew(req.body)

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Notification created successfully',
      data: newNoti
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Lấy thông báo của 1 user (tenant/host)
 */
const getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.params.userId
    const notifications = await notificationService.getNotificationsByUser(userId)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'User notifications retrieved successfully',
      data: notifications
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Lấy thông báo chung của admin
 */
const getAdminNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getNotificationsForAdmin()

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Admin notifications retrieved successfully',
      data: notifications
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Đánh dấu đã đọc
 */
const markAsRead = async (req, res, next) => {
  try {
    const notiId = req.params.id
    const updatedNoti = await notificationService.markAsRead(notiId)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Notification marked as read',
      data: updatedNoti
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Xóa mềm
 */
const deleteNotification = async (req, res, next) => {
  try {
    const notiId = req.params.id
    const deletedNoti = await notificationService.deleteNotification(notiId)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Notification deleted successfully',
      data: deletedNoti
    })
  } catch (error) {
    next(error)
  }
}

export const notificationController = {
  createNotification,
  getUserNotifications,
  getAdminNotifications,
  markAsRead,
  deleteNotification
}
