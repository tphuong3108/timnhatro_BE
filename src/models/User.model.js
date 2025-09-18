import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { PHONE_RULE, PHONE_RULE_MESSAGE } from '~/utils/validators'
import LoginLogModel from './LoginLog.model'

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: (v) => PHONE_RULE.test(v),
      message: PHONE_RULE_MESSAGE
    }
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 200,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  favorites: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'places'
    }],
    required: true,
    default: []
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  points: {
    type: Number,
    default: 0
  },
  sharedBlogs: [{
    blog: { type: mongoose.Schema.Types.ObjectId, ref: 'blogs' },
    sharedAt: { type: Date, default: Date.now }
  }],
  banned: {
    type: Boolean,
    default: false
  },
  _destroyed: {
    type: Boolean,
    default: false
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

userSchema.methods.saveLog = async function (ipAddress, device) {
  const log = new LoginLogModel({
    userId: this._id,
    ipAddress,
    device
  })
  await log.save()
}

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
  }
  next()
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

userSchema.index({ currentLocation: '2dsphere' })

const UserModel = mongoose.model('users', userSchema)

export default UserModel