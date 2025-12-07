import express from "express";
import { paymentController } from "../controllers/payment.controller.js";
import { verifyToken, verifyRoles } from "../middlewares/auth.middleware.js";
import { roomValidation } from "../validations/room.validation.js";

const Router = express.Router();
Router.post(
  '/premium/create-payment-url',
  verifyToken,
  verifyRoles('host'),
  roomValidation.createPremiumPaymentValidate,
  paymentController.createPremiumPaymentUrl
);

Router.get("/premium/return", paymentController.returnPremiumPayment);

Router.get("/check-status", paymentController.checkPaymentStatus);

export const paymentRoute = Router;
