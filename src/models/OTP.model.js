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
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '5m' // OTP expires in 5 minutes
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
