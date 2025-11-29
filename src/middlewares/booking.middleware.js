import Booking from "../models/Booking.model.js";
import ApiError from "../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

/**
 * Middleware: Kiểm tra booking có tồn tại
 */
const findBooking = async (bookingId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Booking không tồn tại");
  }
  return booking;
};

/**
 * Chỉ cho Host của phòng trọ được xử lý approve/decline
 */
export const verifyBookingOwnerHost = async (req, res, next) => {
  try {
    const booking = await findBooking(req.params.id);

    if (!booking.hostId) {
      return res.status(400).json({ error: "Booking chưa có hostId" });
    }

    if (booking.hostId.toString() !== req.user.id) {
      return next(
        new ApiError(StatusCodes.FORBIDDEN, "Bạn không có quyền xử lý booking này")
      );
    }

    req.booking = booking;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Chỉ cho Tenant được hủy
 */
export const verifyBookingOwnerTenant = async (req, res, next) => {
  try {
    const booking = await findBooking(req.params.id);

    if (!booking.userId) {
      return res.status(500).json({ error: "Booking không có userId" });
    }

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Bạn không thể hủy booking của người khác" });
    }

    req.booking = booking;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware tổng quát
 */
export const verifyBookingOwner = (role) => {
  return async (req, res, next) => {
    try {
      const booking = await findBooking(req.params.id);

      if (role === "host" && booking.hostId.toString() !== req.user.id) {
        return next(
          new ApiError(StatusCodes.FORBIDDEN, "Bạn không phải chủ trọ của phòng này")
        );
      }

      if (role === "tenant" && booking.userId.toString() !== req.user.id) {
        return next(
          new ApiError(StatusCodes.FORBIDDEN, "Bạn không phải người đặt lịch này")
        );
      }

      req.booking = booking;
      next();
    } catch (err) {
      next(err);
    }
  };
};
