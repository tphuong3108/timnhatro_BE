import { StatusCodes } from 'http-status-codes'
import { amenityService } from '~/services/amenity.service.js'

//Tiện ích
const createNew = async (req, res, next) => {
  try {
    const newAmenity = await amenityService.createNew(req.body)
    res.status(StatusCodes.CREATED).json({
      message: 'Amenity created successfully',
      data: newAmenity
    })
  } catch (error) {
    next(error)
  }
}

const getAllAmenities = async (req, res, next) => {
  try {
    const amenities = await amenityService.getAllAmenities(req.query)
    res.status(StatusCodes.OK).json({
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
      message: 'Amenity deleted successfully',
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
