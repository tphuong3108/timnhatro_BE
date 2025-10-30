import { wardService } from '../services/ward.service.js'

// Lấy tất cả phường/xã
const getAll = async (req, res) => {
  try {
    const wards = await wardService.getAll()
    res.json(wards)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

// Lấy phường/xã theo _id
const getById = async (req, res) => {
  try {
    const ward = await wardService.getById(req.params.id)
    if (!ward) return res.status(404).json({ message: 'Ward not found' })
    res.json(ward)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

// Lấy phường/xã theo tên
const getByName = async (req, res) => {
  try {
    const ward = await wardService.getByName(req.params.name)
    if (!ward) return res.status(404).json({ message: 'Ward not found' })
    res.json(ward)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

// Lấy phường/xã gần tọa độ
const getByCoordinates = async (req, res) => {
  try {
    const { longitude, latitude, radius } = req.query
    if (!longitude || !latitude) {
      return res.status(400).json({ message: 'Longitude and latitude are required' })
    }
    const wards = await wardService.getByCoordinates(parseFloat(longitude), parseFloat(latitude), parseInt(radius) || 5000)
    res.json(wards)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

// Cập nhật tọa độ của phường/xã
const updateCoordinates = async (req, res) => {
  try {
    const { coordinates } = req.body
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ message: 'Coordinates must be an array of [longitude, latitude]' })
    }
    const ward = await wardService.updateCoordinates(req.params.id, coordinates)
    if (!ward) return res.status(404).json({ message: 'Ward not found' })
    res.json(ward)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

export const wardController = {
  getAll,
  getById,
  getByName,
  getByCoordinates,
  updateCoordinates
}