import mongoose from 'mongoose'

const loginLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  device: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false
  }
})

const LoginLogModel = mongoose.model('login_logs', loginLogSchema)

export default LoginLogModel
