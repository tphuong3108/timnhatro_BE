import Booking from "../models/Booking.model.js";
import Room from "../models/Room.model.js";

export const bookingService = {
 async createBooking(userId, { roomId, date, time, note }) {
  const room = await Room.findById(roomId);
  if (!room) throw new Error("Room not found");

  const hostId = room.createdBy;
  if (!hostId) throw new Error("Room has no host");

  if (hostId.toString() === userId) {
    throw new Error("Chủ trọ không thể tự đặt lịch");
  }

  // Không chọn quá khứ
  const now = new Date();
  const selectedDateTime = new Date(`${date}T${time}:00`);
  if (selectedDateTime < now) {
    throw new Error("Không thể đặt lịch trong quá khứ");
  }

  // Phòng ngừng hoạt động / đã thuê
  if (room.status === "closed" || room.status === "rented") {
    throw new Error("Phòng hiện không mở để xem");
  }

  // Không đặt trùng lịch bản thân
  const hasBooked = await Booking.findOne({
  roomId,
  userId,
  status: { $in: ["pending", "approved"] }
  });

  if (hasBooked) {
    throw new Error(
      `Bạn đã đặt phòng này trước đó vào ngày ${hasBooked.date} lúc ${hasBooked.time}`
    );
  }
  // Chặn người khác đặt trùng lịch cùng giờ
  const timeBusy = await Booking.findOne({
    roomId,
    date,
    time,
    status: { $in: ["pending", "approved"] }
  });
  if (timeBusy) throw new Error("Khung giờ này đã có người đặt");
  console.log("[BOOKING] Created:", {
  roomId,
  hostId,
  userId,
  date,
  time
});

  return await Booking.create({
    roomId,
    hostId,
    userId,
    date,
    time,
    note,
    status: "pending",
  });
},


  async approveBooking(bookingId, hostId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error("Booking not found");

    if (booking.hostId.toString() !== hostId)
      throw new Error("Not your booking");
    if (booking.status !== "pending")
  throw new Error("Booking không còn ở trạng thái chờ xử lý");

    booking.status = "approved";
    await booking.save();

    return booking;
  },

  async declineBooking(bookingId, hostId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error("Booking not found");

    if (booking.hostId.toString() !== hostId)
      throw new Error("Not your booking");
    if (booking.status !== "pending")
  throw new Error("Booking không còn ở trạng thái chờ xử lý");

    booking.status = "declined";
    await booking.save();

    return booking;
  },

  async cancelBooking(bookingId, userId) {
    const booking = await Booking.findById(bookingId);
     if (!booking) throw new Error("Booking not found");
    if (booking.userId.toString() !== userId)
      throw new Error("You cannot cancel this booking");
   if (booking.status !== "pending" && booking.status !== "approved") {
    throw new Error("Không thể hủy booking này");
  }

    booking.status = "canceled";
    await booking.save();

    return booking;
  },


  async completeBooking(bookingId, hostId) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (booking.hostId.toString() !== hostId)
    throw new Error("Not your booking");

  if (booking.status !== "approved")
    throw new Error("Chỉ có thể hoàn thành lịch đã được duyệt");

  // Không cho complete lịch trước thời điểm hẹn
  const now = new Date();
  const bookingTime = new Date(`${booking.date}T${booking.time}:00`);
  if (bookingTime > now) {
    throw new Error("Không thể hoàn thành lịch trước thời điểm hẹn");
  }

  booking.status = "completed";
  await booking.save();

    return booking;
  },


  async listBookingsByUser(userId) {
  return Booking.find({ userId })
    .populate("roomId")
    .populate("hostId", "firstName lastName displayName avatar email");
},

  async listBookingsByHost(hostId) {
  return Booking.find({ hostId })
    .populate("roomId")
    .populate("userId", "firstName lastName displayName avatar email");
}

};
