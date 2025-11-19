import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: false },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "users", required: true }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  },
  { timestamps: true }
);

chatSchema.index({ participants: 1 });

export default mongoose.model("Chat", chatSchema);
