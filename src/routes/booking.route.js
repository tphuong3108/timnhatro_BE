import express from "express";
import { bookingController } from "../controllers/booking.controller.js";
import { verifyToken, verifyHost, verifyTenant, verifyRoles } from "../middlewares/auth.middleware.js";
import { verifyBookingOwnerTenant,verifyBookingOwnerHost} from "../middlewares/booking.middleware.js"
const Router = express.Router();
Router.post("/", verifyToken, verifyTenant, bookingController.create);

Router.get("/me", verifyToken, verifyRoles('tenant', 'host'), bookingController.listUser);
Router.get("/host", verifyToken, verifyHost, bookingController.listHost);
Router.get("/check", verifyToken, verifyRoles('tenant', 'host'), bookingController.checkBooked);

Router.put("/:id/approve", verifyToken,verifyBookingOwnerHost, verifyHost, bookingController.approve);
Router.put("/:id/decline", verifyToken,verifyBookingOwnerHost, verifyHost, bookingController.decline);
Router.put(
  "/:id/complete",
  verifyToken,
  verifyBookingOwnerHost,
  verifyHost,
  bookingController.complete
);

Router.put("/:id/cancel", verifyToken,verifyBookingOwnerTenant, verifyTenant, bookingController.cancel);


export const bookingRoom = Router;
