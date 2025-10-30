import mongoose from 'mongoose'

const wardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['phường', 'xã', 'đặc khu'], required: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  }
})

wardSchema.index({ location: '2dsphere' })

export default mongoose.model('wards', wardSchema)