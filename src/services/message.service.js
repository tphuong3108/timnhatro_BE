import Message from "../models/Message.model.js";
import Chat from "../models/Chat.model.js";
import { notificationService } from "./notification.service.js";

export const messageService = {
  async sendMessageWithChatId({ chatId, senderId, content = "", images = [] }) {
    if (!chatId || !senderId) {
      throw new Error("Missing chatId or senderId");
    }

    const chat = await Chat.findById(chatId);
    if (!chat) throw new Error("Chat does not exist");

    const message = await Message.create({
      chatId,
      sender: senderId,
      content,
      images,
      type: images.length > 0 ? "image" : "text",
    });
    await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

     // Gửi thông báo cho tất cả participants ngoại trừ sender
    const receivers = chat.participants.filter(p => p._id.toString() !== senderId.toString());
    for (const receiver of receivers) {
      await notificationService.createNew({
        userId: receiver._id,
        title: "Tin nhắn mới",
        content: content
          ? `Bạn có tin nhắn mới từ ${chat.participants.find(p => p._id.toString() === senderId.toString()).firstName}`
          : "Bạn có tin nhắn mới",
        type: "chat:message",
      });
    }
    return message.populate("sender", "firstName lastName avatar");
  },
  async getMessages(chatId) {
    const chat = await Chat.findById(chatId).populate(
      "roomId",
      "name address images price"
    );

    if (!chat) throw new Error("Chat not found");

    const messages = await Message.find({ chatId })
      .populate("sender", "firstName lastName avatar")
      .sort({ createdAt: 1 });

    return { room: chat.roomId, messages };
  },
  async markAsSeen(chatId, userId) {
    await Message.updateMany(
      { chatId, seenBy: { $ne: userId } },
      { $push: { seenBy: userId } }
    );
  },
};
