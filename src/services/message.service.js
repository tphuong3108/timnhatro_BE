import Message from "../models/Message.model.js";
import Chat from "../models/Chat.model.js";
import User from "../models/User.model.js";
import { notificationService } from "./notification.service.js";
import mongoose from "mongoose";

export const messageService = {

  async sendMessageWithChatId({ chatId, senderId, content = "", images = [] }) {
    if (!chatId || !senderId) {
      throw new Error("Missing chatId or senderId");
    }

    const chat = await Chat.findById(chatId).populate(
      "participants",
      "firstName lastName avatar"
    );

    if (!chat) throw new Error("Chat does not exist");
 
    const lastMessage = await Message.findOne({ chatId }).sort({ createdAt: -1 });
    if (lastMessage) {
      const sameSender = String(lastMessage.sender) === String(senderId);
      const sameContent = (lastMessage.content || "") === (content || "");
      const withinWindow = (Date.now() - new Date(lastMessage.createdAt).getTime()) <= 5000; // 5s
      const sameImages = JSON.stringify(lastMessage.images || []) === JSON.stringify(images || []);

      if (sameSender && sameContent && sameImages && withinWindow) {
       
        return lastMessage.populate("sender", "firstName lastName avatar");
      }
    }

    // Ép senderId thành ObjectId để so sánh
    const senderObjectId = new mongoose.Types.ObjectId(senderId);

    const message = await Message.create({
      chatId,
      sender: senderId,
      content,
      images,
      type: images.length > 0 ? "image" : "text",
    });

    await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

    // sender trong participants
    const sender = chat.participants.find((p) =>
      p._id.equals(senderObjectId)
    );

    if (!sender) {
      console.error("⚠ Sender not found in chat participants:", senderId);
    }

    const receivers = chat.participants.filter(
      (p) => !p._id.equals(senderObjectId)
    );

    for (const receiver of receivers) {
      await notificationService.createNew({
        userId: receiver._id,
        type: "chat:message",

        referenceId: chatId,
        referenceType: "chat",

        title: "Tin nhắn mới",
        message: sender
          ? `Bạn có tin nhắn mới từ ${sender.firstName} ${sender.lastName}`
          : "Bạn có tin nhắn mới",
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
  async deleteMessagesByChat(chatId, userId) {
    const chat = await Chat.findById(chatId);
    if (!chat) throw new Error("Chat not found");

    const isParticipant = chat.participants.some(
      (p) => String(p) === String(userId)
    );
    if (!isParticipant) throw new Error("Not allowed to delete messages of this chat");

    await Message.deleteMany({ chatId });

    await Chat.findByIdAndUpdate(chatId, { lastMessage: null });

    return { success: true };
  }
};
