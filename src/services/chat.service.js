import Chat from "../models/Chat.model.js";
import { notificationService } from "./notification.service.js";
import Message from "../models/Message.model.js";

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
      type: "chat:new",
      referenceId: populatedChat._id,        
      referenceType: "chat",
      title: "Bạn có chat mới",
      message: `Bạn có một chat mới về phòng ${populatedChat.roomId.name}`
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
  async deleteChat(chatId, userId) {
    const chat = await Chat.findById(chatId);
    if (!chat) throw new Error("Chat not found");

    const isParticipant = chat.participants.some(
      (p) => String(p) === String(userId)
    );
    if (!isParticipant) throw new Error("Not allowed to delete this chat");

    await Message.deleteMany({ chatId });

    // Delete the chat itself
    await Chat.findByIdAndDelete(chatId);

    return { success: true };
  }
};
