import { chatService } from "../services/chat.service.js";
import { StatusCodes } from "http-status-codes";

export const chatController = {

  async getUserChats(req, res, next) {
    try {
      const userId = req.user.id;

      const chats = await chatService.getChatsByUser(userId);
      res.status(StatusCodes.OK).json({ success: true, data: chats });
    } catch (err) {
      next(err);
    }
  },

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
  async deleteChat(req, res, next) {
    try {
      const chatId = req.params.id;
      const userId = req.user.id;

      const result = await chatService.deleteChat(chatId, userId);
      res.status(StatusCodes.OK).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
};
