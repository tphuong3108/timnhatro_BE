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
Router.get(
  "/history/host",
  verifyToken,
  verifyRoles('host', 'admin'),
  paymentController.getHostPaymentHistory
);

Router.get(
  "/history/admin",
  verifyToken,
  verifyRoles('admin'),
  paymentController.getAdminPaymentHistory
);

// Lấy chi tiết thanh toán premium (Host + Admin)
Router.get(
  "/premium/:paymentId",
  verifyToken,
  verifyRoles('host', 'admin'),
  paymentController.getPaymentDetails
);

export const paymentRoute = Router;

