import { StatusCodes } from 'http-status-codes'
import { amenityService } from '~/services/amenity.service.js'

const createNew = async (req, res, next) => {
  try {
    const newAmenity = await amenityService.createNew(req.body)
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Amenity created successfully',
      data: newAmenity
    })
  } catch (error) {
    next(error)
  }
}

const getAllAmenities = async (req, res, next) => {
  try {
    const amenities = await amenityService.getAllAmenities()
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Amenities retrieved successfully',
      data: amenities
    })
  } catch (error) {
    next(error)
  }
}

const updateAmenity = async (req, res, next) => {
  try {
    const amenityId = req.params.id
    const updatedAmenity = await amenityService.updateAmenity(amenityId, req.body)
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Amenity updated successfully',
      data: updatedAmenity
    })
  } catch (error) {
    next(error)
  }
}

const deleteAmenity = async (req, res, next) => {
  try {
    const amenityId = req.params.id
    const deletedAmenity = await amenityService.deleteAmenity(amenityId)
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Amenity soft-deleted successfully',
      data: deletedAmenity
    })
  } catch (error) {
    next(error)
  }
}

export const amenityController = {
  createNew,
  getAllAmenities,
  updateAmenity,
  deleteAmenity
}
