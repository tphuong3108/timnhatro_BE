import Chat from "../models/Chat.model.js";
import { notificationService } from "./notification.service.js";

export const chatService = {
  async getChatsByUser(userId) {
    return Chat.find({ participants: userId })
      .populate("participants", "firstName lastName avatar email")
      .populate({
        path: "lastMessage",
        select: "type content images sender createdAt",
        populate: { path: "sender", select: "firstName lastName avatar" },
      })
      .populate("roomId", "name images address price")
      .sort({ updatedAt: -1 });
  },
  async createOrGetChat(senderId, receiverId, roomId) {
    if (!senderId || !receiverId) {
      throw new Error("Missing senderId or receiverId");
    }

    if (!roomId) {
      throw new Error("roomId is required for room-specific chat");
    }
    const participants = [String(senderId), String(receiverId)];
    const participantsKey = participants.sort().join("_");

    let chat = await Chat.findOne({
      participantsKey,
      roomId,
    })
      .populate("participants", "firstName lastName avatar email")
      .populate("roomId", "name images address price");

    if (chat) return chat;
    const newChat = await Chat.create({
      participants,
      participantsKey,
      roomId,
    });

    const populatedChat = await Chat.findById(newChat._id)
      .populate("participants", "firstName lastName avatar email")
      .populate("roomId", "name images address price");

    // Thông báo cho receiver về chat mới
    await notificationService.createNew({
      userId: receiverId,
      title: "Bạn có chat mới",
      content: `Bạn có một chat mới về phòng ${populatedChat.roomId.name}`,
      type: "chat:new",
    });

    return populatedChat;
  },
  async updateLastMessage(chatId, messageId) {
    return Chat.findByIdAndUpdate(
      chatId,
      { lastMessage: messageId },
      { new: true }
    );
  },
};
