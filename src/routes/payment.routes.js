
import express from "express";
import { paymentController } from "../controllers/payment.controller.js";

const Router = express.Router();

Router.post("/create", paymentController.createPaymentUrl);
Router.get("/return", paymentController.returnPayment);

export const paymentRoute = Router;
