import { bookingService } from "../services/booking.service.js";
import Booking from "../models/Booking.model.js";
import { StatusCodes } from "http-status-codes";

export const bookingController = {
  create: async (req, res) => {
    try {
      const booking = await bookingService.createBooking(req.user.id, req.body);
      res.status(StatusCodes.CREATED).json({
        message: "Booking created",
        booking,
      });
    } catch (err) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
    }
  },

  checkBooked: async (req, res) => {
    try {
      const userId = req.user.id;
      const { roomId } = req.query;

      if (!roomId) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: "roomId is required" });
      }

      const exists = await Booking.findOne({
        roomId,
        userId,
        status: { $ne: "canceled" }
      });

      return res.status(StatusCodes.OK).json({
        booked: !!exists,
      });
    } catch (err) {
      console.error("Check booking error:", err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Server error",
      });
    }
  },

  approve: async (req, res) => {
    try {
      const booking = await bookingService.approveBooking(
        req.params.id,
        req.user.id
      );
      res.status(StatusCodes.OK).json({
        message: "Booking approved",
        booking,
      });
    } catch (err) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
    }
  },

  decline: async (req, res) => {
    try {
      const booking = await bookingService.declineBooking(
        req.params.id,
        req.user.id
      );
      res.status(StatusCodes.OK).json({
        message: "Booking declined",
        booking,
      });
    } catch (err) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
    }
  },

  cancel: async (req, res) => {
    try {
      const booking = await bookingService.cancelBooking(
        req.params.id,
        req.user.id
      );
      res.status(StatusCodes.OK).json({
        message: "Booking canceled",
        booking,
      });
    } catch (err) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
    }
  },
  complete: async (req, res) => {
    try {
      const booking = await bookingService.completeBooking(
        req.params.id,
        req.user.id
      );
      res.json({ message: "Booking completed", booking });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },


  listUser: async (req, res) => {
    try {
      const bookings = await bookingService.listBookingsByUser(req.user.id);
      res.status(StatusCodes.OK).json(bookings);
    } catch (err) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: err.message,
      });
    }
  },

  listHost: async (req, res) => {
    try {
      const bookings = await bookingService.listBookingsByHost(req.user.id);
      res.status(StatusCodes.OK).json(bookings);
    } catch (err) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: err.message,
      });
    }
  }
};
