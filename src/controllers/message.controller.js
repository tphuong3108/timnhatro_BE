import { messageService } from "../services/message.service.js";
import { StatusCodes } from "http-status-codes";

export const messageController = {
  // GET /messages/:chatId
  async getMessages(req, res, next) {
    try {
      const { chatId } = req.params;

      const data = await messageService.getMessages(chatId);

      res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  // POST /messages
  async sendMessage(req, res, next) {
    try {
      const senderId = req.user.id;
      const { chatId, content, images } = req.body;

      const message = await messageService.sendMessageWithChatId({
        chatId,
        senderId,
        content,
        images,
      });

      res
        .status(StatusCodes.CREATED)
        .json({ success: true, data: message });
    } catch (err) {
      next(err);
    }
  },
};
