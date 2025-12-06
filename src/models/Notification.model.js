import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    // Người nhận thông báo:
    // - Tenant / Host → userId là ObjectId
    // - Admin → để userId = null (thông báo chung)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      default: null // admin sẽ dùng null để tất cả admin cùng nhìn thấy 1 thông báo
    },

    role: {
      type: String,
      enum: ['tenant', 'host', 'admin'],
      required: true
    },

    // Loại thông báo (thu gọn theo yêu cầu: booking, payment, review, report)
    type: {
      type: String,
      enum: [
        // Review
        'review:new',
        'review:deleted',
        'review:reported',
        'review:banned',
        'review:liked',

        // Room
        'room:new',
        'room:reported',
        'room:banned',
        'room:pending_review',
        'room:approved',
        'room:rejected',
        'room:hidden',
        'room:liked',

        // Booking
        'booking:new',
        'booking:created',
        'booking:approved',
        'booking:declined',
        'booking:canceled_by_user',
        'booking:canceled_by_host',
        'booking:completed',

        // Account
        'account:banned',
        'account:self_banned',
        'account:deleted',
        'account:role_upgraded',

        // Payment
        'payment:success',
        'payment:failed',

        // Chat
        'chat:message',
        'chat:new'
      ],
      required: true
    },

    // Dùng để mở thông báo đến chi tiết đối tượng booking / room / review
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    referenceType: {
      type: String,
      enum: ['booking', 'room', 'review', 'payment', 'user', 'chat'],
      default: null
    },

    // Nội dung hiển thị
    title: {
      type: String,
      required: true,
      trim: true
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    // Tùy chọn mở rộng, ví dụ gửi roomName, amount, bookingTime...
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    // Đánh dấu đã đọc
    isRead: {
      type: Boolean,
      default: false
    },

    // Xóa mềm
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Indexes để tối ưu tìm kiếm
notificationSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 })
notificationSchema.index({ role: 1, isDeleted: 1, createdAt: -1 })

// Transform output: _id -> id, remove __v
notificationSchema.method('toJSON', function () {
  const obj = this.toObject()
  obj.id = obj._id
  delete obj._id
  delete obj.__v
  return obj
})

// Optional: nếu referenceType tồn tại thì referenceId phải có
notificationSchema.pre('validate', function (next) {
  if (this.referenceType && !this.referenceId) {
    this.invalidate('referenceId', 'referenceId is required when referenceType is set')
  }
  next()
})

const NotificationModel = mongoose.model('Notification', notificationSchema)
export default NotificationModel
