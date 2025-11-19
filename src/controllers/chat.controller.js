import { chatService } from "../services/chat.service.js";
import { StatusCodes } from 'http-status-codes'
export const chatController = {
  async getUserChats(req, res, next) {
    try {
      const userId = req.user.id;
      if (!userId) return res.status(400).json({ success: false, message: "Thiếu userId" });
      const chats = await chatService.getChatsByUser(userId);
      res.status(StatusCodes.OK).json({ success: true, data: chats });
    } catch (err) {
      next(err);
    }
  },

  async createOrGetChat(req, res, next) {
    try {
      const senderId = req.user.id;
      const {receiverId, roomId } = req.body;
      if (!senderId || !receiverId)
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Thiếu senderId hoặc receiverId" });

      const chat = await chatService.createOrGetChat(senderId, receiverId, roomId);
      res.status(StatusCodes.OK).json({ success: true, data: chat });
    } catch (err) {
      next(err);
    }
  },
};
