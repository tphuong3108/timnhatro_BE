import { messageService } from "../services/message.service.js";
import { chatService } from "../services/chat.service.js";

export const setupChatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("⚡ Client connected:", socket.id);

    socket.on("joinChat", (chatId) => {
      if (!chatId) return;
      socket.join(chatId.toString());
    });


    socket.on("sendMessage", async (data) => {
      try {
        const { chatId, senderId, content, images } = data;
        if (!chatId || !senderId) return;

        
        const message = await messageService.sendMessageWithChatId({
          chatId,
          senderId,
          content: content || "",
          images: images || [],
        });
        await chatService.updateLastMessage(chatId, message._id);

        io.to(chatId.toString()).emit("receiveMessage", message);
      } catch (err) {
        console.error("Socket sendMessage error:", err);
      }
    });

    socket.on("markAsSeen", async ({ chatId, userId }) => {
      try {
        if (!chatId || !userId) return;
        await messageService.markAsSeen(chatId, userId);
        io.to(chatId.toString()).emit("messagesSeen", { chatId, userId });
      } catch (err) {
        console.error("markAsSeen error:", err);
      }
    });

    socket.on("leaveChat", (chatId) => {
      if (!chatId) return;
      socket.leave(chatId.toString());
    });

    socket.on("disconnect", () => {
      console.log("🔌 Client disconnected:", socket.id);
    });
  });
};
