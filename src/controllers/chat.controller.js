import { chatService } from "../services/chat.service.js";
import { StatusCodes } from "http-status-codes";

export const chatController = {
  // GET ALL CHATS OF USER
  async getUserChats(req, res, next) {
    try {
      const userId = req.user.id;

      const chats = await chatService.getChatsByUser(userId);
      res.status(StatusCodes.OK).json({ success: true, data: chats });
    } catch (err) {
      next(err);
    }
  },

  // CREATE OR GET CHAT
  async createOrGetChat(req, res, next) {
    try {
      const senderId = req.user.id;
      const { receiverId, roomId } = req.body;

      if (!receiverId || !roomId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "receiverId and roomId are required",
        });
      }

      const chat = await chatService.createOrGetChat(
        senderId,
        receiverId,
        roomId
      );

      res.status(StatusCodes.OK).json({ success: true, data: chat });
    } catch (err) {
      next(err);
    }
  },
};
