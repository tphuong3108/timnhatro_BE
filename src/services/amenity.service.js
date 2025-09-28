import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import AmenityModel from '~/models/Amenity.model.js'

const createNew = async (amenityData) => {
  try {
    const newAmenity = await AmenityModel.create({ ...amenityData })
    return newAmenity
  } catch (error) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message)
  }
}

const getAllAmenities = async () => {
  try {
    const amenities = await AmenityModel.find()
    return amenities
  } catch (error) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message)
  }
}

const updateAmenity = async (amenityId, updateData) => {
  try {
    const updatedAmenity = await AmenityModel.findByIdAndUpdate(amenityId, updateData, { new: true })
    if (!updatedAmenity) throw new ApiError(StatusCodes.NOT_FOUND, 'Amenity not found')
    return updatedAmenity
  } catch (error) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message)
  }
}

const deleteAmenity = async (amenityId) => {
  try {
    const deletedAmenity = await AmenityModel.findByIdAndDelete(amenityId)
    if (!deletedAmenity) throw new ApiError(StatusCodes.NOT_FOUND, 'Amenity not found')
    return deletedAmenity
  } catch (error) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message)
  }
}

export const amenityService = {
  createNew,
  getAllAmenities,
  updateAmenity,
  deleteAmenity
}
