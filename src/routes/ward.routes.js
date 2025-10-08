import { wardController } from '../controllers/ward.controller.js'
import express from 'express'

const Router = express.Router()

Router.get('/', wardController.getAll)
Router.get('/id/:id', wardController.getById)
Router.get('/name/:name', wardController.getByName)

export const wardRoute = Router
