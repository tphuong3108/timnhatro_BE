import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "rooms", required: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },

    date: { type: String, required: true },     // "2025-12-01"
    time: { type: String, required: true },     // "14:00"

    note: { type: String },

    status: {
      type: String,
      enum: ["pending", "approved", "declined", "canceled", "completed"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Booking", BookingSchema);
