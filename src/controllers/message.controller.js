import { messageService } from "../services/message.service.js";

export const messageController = {
  async getMessages(req, res, next) {
    try {
      const { chatId } = req.params;
      if (!chatId) return res.status(400).json({ success: false, message: "Thiếu chatId" });

      const messages = await messageService.getMessages(chatId);
      res.status(200).json({ success: true, data: messages });
    } catch (err) {
      next(err);
    }
  },

  async sendMessage(req, res, next) {
    try {
      const senderId = req.user.id;
      const { receiverId, content, roomId } = req.body;
      const message = await messageService.sendMessage(senderId, receiverId, content, roomId);
      res.status(201).json({ success: true, data: message });
    } catch (err) {
      next(err);
    }
  },
};
