import Message from "../models/Message.model.js";
import Chat from "../models/Chat.model.js";

export const messageService = {

  sendMessage: async (senderId, receiverId, content, roomId = null) => {
    if (!senderId || !receiverId) throw new Error("Thiếu senderId hoặc receiverId");
    // 1️⃣ Tìm hoặc tạo chat
    let chatQuery = { participants: { $all: [senderId, receiverId] } };
    if (roomId) chatQuery.roomId = roomId;

    let chat = await Chat.findOne(chatQuery);
    if (!chat) {
      chat = await Chat.create({
        roomId,
        participants: [senderId, receiverId],
      });
    }

    // 2️⃣ Tạo message
    const message = await Message.create({
      chatId: chat._id,
      sender: senderId,
      content,
    });

    // 3️⃣ Cập nhật lastMessage
    await Chat.findByIdAndUpdate(chat._id, { lastMessage: message._id });

    return message.populate("sender", "firstName lastName avatar");
  },

  getMessages: async (chatId) => {
    return Message.find({ chatId })
      .populate("sender", "firstName lastName avatar")
      .sort({ createdAt: 1 });
  },

  markAsSeen: async (chatId, userId) => {
    await Message.updateMany(
      { chatId, seenBy: { $ne: userId } },
      { $push: { seenBy: userId } }
    );
  },
};
