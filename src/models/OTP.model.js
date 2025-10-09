import mongoose from 'mongoose'
import UserModel from './User.model'

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  otp: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 6
  },
  type: {
    type: String,
    required: true,
    enum: ['registration', 'password-reset', 'general']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => Date.now() + 5 * 60 * 1000, // 5 minutes from creation
  },
  registrationData: {
    firstName: { type: String },
    lastName: { type: String },
    password: { type: String },
    phone: { type: String },
  }
})

otpSchema.methods.verifyOTP = async function () {
  try {
    this.isVerified = true
    await this.save()
  } catch (error) {
    throw new Error('Failed to verify OTP')
  }
}

const OTPModel = mongoose.model('otps', otpSchema)

export default OTPModel
