import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    content: { type: String, trim: true },
    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }]
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
