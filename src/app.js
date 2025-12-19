import express from "express";
import cors from "cors";
import { connectDB } from "~/config/db.js";
import { env } from "~/config/environment.js";
import { APIs } from "~/routes/index.js";
import { errorHandler } from "~/middlewares/error.middleware.js";
import os from "os";
import { setupChatSocket } from "~/sockets/chat.socket.js";
import { initWeaviate, createRoomSchema, upsertAllRooms } from "./services/vector.service.js";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";

const APP_PORT = env.APP_PORT || 5050;

const __dirname = path.resolve();
// Lấy IP LAN tự động
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

const START_SERVER = async () => {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });
  app.set("io", io);
  setupChatSocket(io);
  
  // Middleware phải đặt TRƯỚC routes
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));
  app.use(express.static(path.join(__dirname, "public")));
  app.get("/", (req, res) => {
  res.send("Hello! Welcome to TIMNHATRO Backend Server.");
});
  // Routes
  app.use("/api/hosts", APIs);
  app.use("/api", APIs);
  app.use(errorHandler);

  //  listen toàn mạng
  httpServer.listen(APP_PORT, "0.0.0.0", () => {
    const localIP = getLocalIP();
    console.log("=========================================");
    console.log(`Server đang chạy tại:`);
    console.log(` Local:     http://localhost:${APP_PORT}`);
    console.log(` Network:   http://${localIP}:${APP_PORT}`);
    console.log("=========================================");
  });
};

(async () => {
  console.log("Connecting to database...");
  await connectDB();
  initWeaviate();
  console.log("Database connected successfully");
  try {
    await initWeaviate();
    
    const schemaStatus = await createRoomSchema();
    console.log(schemaStatus);

  } catch (error) {
    console.error("Lỗi trong quá trình khởi tạo hoặc đồng bộ Weaviate:", error.message);
  }
  console.log("Starting server...");
  await START_SERVER();
})();
