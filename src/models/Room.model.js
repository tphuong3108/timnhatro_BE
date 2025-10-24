import mongoose from 'mongoose'
import slugify from 'slugify'

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  slug: {
    type: String,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 500
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  amenities: {
    type: [mongoose.Schema.Types.ObjectId],
    required: true,
    ref: 'amenities',
    default: []
  },
  address: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 200
  },
  ward: { //đổi lại để ward 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'wards',
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: false
    },
    coordinates: {
      type: [Number],
      default: []
    }
  },
  images: {
    type: [{
      type: String,
      required: true
    }],
    default: []
  },
  videos: {
    type: [{
      type: String,
      required: true
    }],
    default: []
  },
  avgRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  favorites: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Room',
    default: [],
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  totalLikes: {
    type: Number,
    default: 0
  },
  viewCount: {
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
  status: {
    type: String,
    enum: ['pending', 'approved', 'hidden'],
    default: 'pending'
  },
  availability: {
    type: String,
    enum: ['available', 'unavailable'],
    default: 'available'
  },
  isDeleted: {
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    default: null
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

// Function to generate slug from name using slugify package
function generateSlug(name) {
  return slugify(name, {
    lower: true,
    strict: true,
    locale: 'vi', // Vietnamese locale support
    remove: /[*+~.()'"!:@]/g // Remove special characters
  })
}

// Pre-save middleware to generate slug
roomSchema.pre('save', async function (next) {
  if (this.isModified('name') || this.isNew) {
    let baseSlug = generateSlug(this.name)
    let slug = baseSlug
    let counter = 1

    // Check if slug already exists and make it unique
    while (await mongoose.model('rooms').findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    this.slug = slug
  }
  next()
})

roomSchema.index({ location: '2dsphere' })

roomSchema.methods.updateTotalLikes = async function () {
  this.totalLikes = this.likeBy.length
  await this.save()
}

const RoomModel = mongoose.model('rooms', roomSchema)

export default RoomModel
