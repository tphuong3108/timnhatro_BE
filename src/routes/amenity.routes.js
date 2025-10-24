
import express from 'express'
import { amenityController } from '~/controllers/amenity.controller.js'
import { verifyToken, verifyAdmin, verifyRoles } from '~/middlewares/auth.middleware.js'
import { amenityValidation } from '~/validations/amenity.validation.js'
import { generalValidation } from '~/validations/general.validation.js'

const Router = express.Router()

Router.post('/', verifyToken, verifyRoles('tenant','admin'), amenityValidation.createNew, amenityController.createNew)
Router.get('/', amenityController.getAllAmenities)
Router.patch('/:id', verifyToken, verifyRoles('tenant','admin'), generalValidation.paramIdValidate, amenityController.updateAmenity)
Router.delete('/:id', verifyToken, verifyAdmin, generalValidation.paramIdValidate, amenityController.deleteAmenity)

export const amenityRoute = Router