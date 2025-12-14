import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import NotificationModel from '~/models/Notification.model.js'
import UserModel from '~/models/User.model.js'
import RoomModel from '~/models/Room.model.js'
import BookingModel from "~/models/Booking.model.js";

/**
 * Tạo thông báo mới
 * - Hỗ trợ: truyền content thay cho message
 * - Nếu không truyền role sẽ tự suy:
 *    - userId === null => role = 'admin'
 *    - userId != null => lấy role từ UserModel nếu có, fallback 'tenant'
 * - Nếu truyền referenceId nhưng thiếu referenceType sẽ try infer từ type (booking|room|review|payment|account)
 */
const createNew = async (data) => {
  try {
    const payload = { ...data }

    // map content -> message (hợp nhất các gọi cũ)
    if (!payload.message && payload.content) {
      payload.message = payload.content
      delete payload.content
    }

    // ensure title/message exist (model will still validate, nhưng cung cấp lỗi rõ hơn)
    if (!payload.title) {
      payload.title = payload.message?.slice(0, 60) || ''
    }

    // infer role if missing
    if (!payload.role) {
      if (payload.userId == null) {
        payload.role = 'admin'
      } else {
        try {
          const user = await UserModel.findById(payload.userId).select('role')
          payload.role = user?.role || 'tenant'
        } catch (e) {
          // nếu lookup lỗi thì fallback an toàn
          payload.role = 'tenant'
        }
      }
    }

    // infer referenceType from type when possible
    if (payload.referenceId && !payload.referenceType && payload.type) {
      const main = String(payload.type).split(':')[0]
      const map = {
        booking: 'booking',
        room: 'room',
        review: 'review',
        payment: 'payment',
        account: 'user',
        chat: 'chat'
      }
      if (map[main]) payload.referenceType = map[main]
    }

    const newNotification = await NotificationModel.create(payload)
    return newNotification
  } catch (error) {
    // nếu là validation error từ mongoose/Joi trả về BAD_REQUEST để client dễ xử lý
    const code = error.statusCode || error.code
    if (code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Duplicate notification')
    }
    // nếu là validation từ mongoose
    if (error.name === 'ValidationError') {
      throw new ApiError(StatusCodes.BAD_REQUEST, error.message)
    }
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message)
  }
}

/**
 * Lấy thông báo của 1 user (tenant, host)
 */
const getNotificationsByUser = async (userId) => {
  try {
    let notifications = await NotificationModel.find({
      userId,
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .lean();
    const populated = await Promise.all(
      notifications.map(async (n) => {

        if (n.type?.startsWith("chat:") && n.referenceType === "chat") {

          return {
            ...n,
            chatId: n.referenceId, 
            iconType: "chat",
          };
        }
        if (n.referenceType === "booking" && n.referenceId) {
          const booking = await BookingModel.findById(n.referenceId)
            .populate("roomId", "_id slug images thumbnail")
            .lean();

            return {
              ...n,
              bookingId: booking?._id,
              roomId: booking?.roomId?._id,
              avatar:
                booking?.roomId?.thumbnail ||
                booking?.roomId?.images?.[0] ||
                null,
              iconType: "booking",
            };
        }

        if (n.referenceType === "room" && n.referenceId) {
          const room = await RoomModel.findById(n.referenceId)
            .select("_id slug images thumbnail")
            .lean();

          return {
            ...n,
            postId: room?._id,
            slug: room?.slug,
            avatar: room?.thumbnail || room?.images?.[0] || null,
            iconType: "room"
          };
        }
        return { ...n, iconType: "default" };
      })
    );
    return populated;
  } catch (error) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};


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
