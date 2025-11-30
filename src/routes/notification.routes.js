import express from 'express'
import { verifyToken, verifyRoles } from '~/middlewares/auth.middleware.js'
import { notificationController } from '~/controllers/notification.controller.js'
import { generalValidation } from '~/validations/general.validation.js'
import { notificationValidation } from '~/validations/notification.validation.js'

const Router = express.Router()

/**
 * Tạo thông báo mới
 * - Admin: userId = null
 * - Tenant/Host: userId = chính user đó
 * → Bạn có thể giới hạn role nếu muốn
 */
Router.post(
  '/',
  verifyToken,
  verifyRoles('tenant', 'host', 'admin'),
  notificationValidation.createNotificationValidate,
  notificationController.createNotification
)

/**
 * Lấy thông báo của 1 user (tenant, host)
 * - tenant tự xem thông báo của tenant
 * - host tự xem thông báo của host
 */
Router.get(
  '/user/:userId',
  verifyToken,
  verifyRoles('tenant', 'host'),
  generalValidation.paramIdValidate,
  notificationController.getUserNotifications
)

/**
 * Lấy thông báo chung cho admin
 */
Router.get(
  '/admin',
  verifyToken,
  verifyRoles('admin'),
  notificationController.getAdminNotifications
)

/**
 * Đánh dấu thông báo là đã đọc
 */
Router.patch(
  '/:id/read',
  verifyToken,
  generalValidation.paramIdValidate,
  notificationController.markAsRead
)

/**
 * Xóa mềm thông báo
 */
Router.delete(
  '/:id',
  verifyToken,
  generalValidation.paramIdValidate,
  notificationController.deleteNotification
)

export const notificationRoute = Router
