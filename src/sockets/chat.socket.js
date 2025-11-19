import { chatService } from "../services/chat.service.js";
import { messageService } from "../services/message.service.js";

export const setupChatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("⚡ Client connected:", socket.id);

    // 1️⃣ Khi user join vào một chat cụ thể
    socket.on("joinChat", (chatId) => {
      if (!chatId) return;
      socket.join(chatId.toString());
      console.log(`🟢 User ${socket.id} joined chat: ${chatId}`);
    });

    // 2️⃣ Khi gửi tin nhắn mới
    // socket.on("sendMessage", async (data) => {
    //   try {
    //     const { senderId, receiverId, content, roomId, chatId } = data;

    //     if (!senderId || !receiverId || !content)
    //       return socket.emit("errorMessage", { message: "Thiếu dữ liệu cần thiết!" });

    //     // ⚙️ Lưu tin nhắn vào DB (gọi service)
    //     const message = await messageService.sendMessage(senderId, receiverId, content, roomId);

    //     // ⚙️ Cập nhật lastMessage của Chat
    //     await chatService.updateLastMessage(message.chatId, message._id);

    //     // 🔄 Gửi realtime cho tất cả user trong room
    //     io.to(message.chatId.toString()).emit("receiveMessage", message);

    //   } catch (err) {
    //     console.error("❌ Socket sendMessage error:", err);
    //     socket.emit("errorMessage", { message: err.message });
    //   }
    // });
  socket.on("sendMessage", async (data) => {
  try {
    console.log("📨 [SERVER] Received socket message:", data);

    const { chatId, senderId, receiverId, content } = data;

    // ❌ KHÔNG lưu DB nữa — vì API đã lưu rồi
    // ✅ chỉ broadcast cho người trong phòng
    if (!chatId) return console.warn("⚠️ Missing chatId in socket message");

    io.to(chatId.toString()).emit("receiveMessage", {
      chatId,
      sender: { _id: senderId },
      receiverId,
      content,
      createdAt: new Date(),
    });

    console.log("📡 [SERVER] Broadcast message to room:", chatId);
  } catch (err) {
    console.error("❌ [SERVER] sendMessage error:", err);
  }
});

    // 3️⃣ Khi user đánh dấu "đã xem"
    socket.on("markAsSeen", async ({ chatId, userId }) => {
      try {
        if (!chatId || !userId) return;

        // Cập nhật seenBy trong DB
        await messageService.markAsSeen(chatId, userId);

        // Gửi thông báo cho room rằng user này đã xem
        io.to(chatId.toString()).emit("messagesSeen", { chatId, userId });

      } catch (err) {
        console.error("❌ markAsSeen error:", err);
        socket.emit("errorMessage", { message: err.message });
      }
    });

    // 4️⃣ Khi user rời chat (optional)
    socket.on("leaveChat", (chatId) => {
      if (!chatId) return;
      socket.leave(chatId.toString());
      console.log(`🔴 User ${socket.id} left chat: ${chatId}`);
    });

    // 5️⃣ Khi ngắt kết nối
    socket.on("disconnect", () => {
      console.log("🔌 Client disconnected:", socket.id);
    });
  });
};
