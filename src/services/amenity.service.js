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
    const amenities = await AmenityModel.find({ isDeleted: false })
    return amenities
  } catch (error) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message)
  }
}

const updateAmenity = async (amenityId, updateData) => {
  try {
    const amenity = await AmenityModel.findOneAndUpdate(
      { _id: amenityId, isDeleted: false },
      updateData,
      { new: true }
    )

    if (!amenity) throw new ApiError(StatusCodes.NOT_FOUND, 'Amenity not found')
    return amenity
  } catch (error) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message)
  }
}

const deleteAmenity = async (amenityId) => {
  try {
    const amenity = await AmenityModel.findById(amenityId)
    if (!amenity || amenity.isDeleted) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Amenity not found')
    }

    amenity.isDeleted = true
    await amenity.save()

    return amenity
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
