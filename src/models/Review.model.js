import mongoose from 'mongoose'
import RoomModel from '~/models/Room.model.js'

const reviewSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'rooms',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    totalLikes: {
      type: Number,
      default: 0
    },
    likeBy: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
      }],
      default: []
    },
    comment: {
      type: String,
      required: true,
      trim: true
    },
    images: {
      type: [String],
      default: []
    },
    _hidden: {
      type: Boolean,
      default: false
    },
    reports: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'users',
          required: true,
        },
        reason: {
          type: String,
          required: true,
          trim: true,
        },
        reportedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true
  }
)


reviewSchema.methods.updateRoomAvgRating = async function () {
  const room = await RoomModel.findById(this.roomId)
  if (room) {
    const reviews = await ReviewModel.find({ roomId: this.roomId })
    const avgRating = reviews?.length == 0 ? 0 : reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    room.avgRating = avgRating || 0
    room.totalRatings = reviews.length
    await room.save()
  }
}

const ReviewModel = mongoose.model('reviews', reviewSchema)

export default ReviewModel
