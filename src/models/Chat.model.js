const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    roomId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "rooms",
      required: true 
    },

    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true }
    ],

    participantsKey: {
      type: String,
      required: true,
      index: true,
    },

    lastMessage: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Message",
      default: null 
    },

    roomLabel: {
      type: String,
      trim: true,
      default: null,
    }
  },
  { timestamps: true }
);

chatSchema.index({ participantsKey: 1, roomId: 1 }, { unique: true });

chatSchema.pre("validate", function (next) {
  const sorted = this.participants
    .map((id) => String(id))
    .sort()
    .join("_");

  this.participantsKey = sorted;
  next();
});

module.exports = mongoose.model("Chat", chatSchema);
