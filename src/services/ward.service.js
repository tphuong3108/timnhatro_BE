import Ward from '../models/Ward.model.js'

// Lấy tất cả phường/xã
const getAll = async () => {
  return await Ward.find()
}

// Lấy phường/xã theo _id
const getById = async (id) => {
  return await Ward.findById(id)
}

// Lấy phường/xã theo tên
const getByName = async (name) => {
  return await Ward.findOne({ name: new RegExp('^' + name + '$', 'i') }) // Case-insensitive search
}

// Lấy phường/xã gần tọa độ
const getByCoordinates = async (longitude, latitude, radius = 5000) => {
  return await Ward.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radius // Bán kính tính bằng mét
      }
    }
  })
}

// Cập nhật tọa độ của phường/xã
const updateCoordinates = async (id, coordinates) => {
  return await Ward.findByIdAndUpdate(
    id,
    { location: { type: 'Point', coordinates } },
    { new: true } // Trả về dữ liệu sau khi cập nhật
  )
}

export const wardService = {
  getAll,
  getById,
  getByName,
  getByCoordinates,
  updateCoordinates
}