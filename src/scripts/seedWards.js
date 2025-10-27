const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')
const Ward = require('../models/Ward.model.js')
const db = require('../config/db.js')

const wardsPath = path.join(__dirname, '..', 'data', 'wards.json')
let wards = JSON.parse(fs.readFileSync(wardsPath, 'utf-8'))

// Gán type: 'Point' cho location và xử lý các trường hợp thiếu dữ liệu
wards = wards.map(ward => {
  const newWard = { ...ward };
  if (newWard.location && newWard.location.coordinates && newWard.location.coordinates.length === 2) {
    // Nếu có tọa độ, đảm bảo có type: 'Point' và đảo ngược tọa độ
    newWard.location = {
      type: 'Point',
      // Đảo ngược từ [lat, lng] thành [lng, lat]
      coordinates: [newWard.location.coordinates[1], newWard.location.coordinates[0]]
    };
  } else {
    // Nếu không có location hoặc coordinates, gán giá trị mặc định
    newWard.location = {
      type: 'Point',
      coordinates: [0, 0] // Tọa độ mặc định
    };
  }
  return newWard;
});

const seedWards = async () => {
  try {
    await db.connectDB()
    await Ward.default.deleteMany({})

    const result = await Ward.default.insertMany(wards)
    return result // Trả về kết quả để kiểm tra
  } catch (error) {
    throw new Error(`Error seeding wards: ${error.message}`)
  } finally {
    mongoose.disconnect()
  }
}

seedWards()
