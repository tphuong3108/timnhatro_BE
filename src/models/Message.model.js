import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    type: {
      type: String,
      enum: ["text", "image", "system"],
      default: "text",
    },

    content: {
      type: String,
      trim: true,
      default: "",
    },

    images: { 
      type: [String], 
      default: [] 
    },

    seenBy: [
      { type: mongoose.Schema.Types.ObjectId, ref: "users" }
    ],
  },
  { timestamps: true }
);

messageSchema.index({ chatId: 1, createdAt: 1 });

export default mongoose.model("Message", messageSchema);
