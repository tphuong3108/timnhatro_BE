import Chat from "../models/Chat.model.js";

export const chatService = {
  // 🔹 Lấy danh sách chat theo user
  async getChatsByUser(userId) {
    return Chat.find({ participants: userId })
      .populate("participants", "firstName lastName avatar email")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "firstName lastName avatar" }
      })
      .sort({ updatedAt: -1 });
  },

  // 🔹 Tạo hoặc lấy chat giữa 2 user (1-1)
  async createOrGetChat(senderId, receiverId, roomId = null) {
    let chat = await Chat.findOne({
      participants: { $all: [senderId, receiverId], $size: 2 },
      roomId: roomId || null,
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [senderId, receiverId],
        roomId,
      });
    }

    return chat.populate("participants", "firstName lastName avatar email");
  },

  // 🔹 Cập nhật lastMessage
  async updateLastMessage(chatId, messageId) {
    return Chat.findByIdAndUpdate(chatId, { lastMessage: messageId }, { new: true });
  },
};
