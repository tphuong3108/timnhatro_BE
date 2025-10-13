import mongoose from 'mongoose'

const adminlogs = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  targetType: {
    type: String,
    required: true,
    enum: ['user', 'room']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetType',
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
  },
  loginCount: {
    type: Number,
    default: 0
  }
})

const AdminLogModel = mongoose.model('adminlogs', adminlogs)

export default AdminLogModel