import express from "express";
import cors from "cors";
import { connectDB } from "~/config/db.js";
import { env } from "~/config/environment.js";
import { APIs } from "~/routes/index.js";
import { errorHandler } from "~/middlewares/error.middleware.js";
import os from "os";

const APP_PORT = env.APP_PORT || 5050;

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
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", APIs);
  app.use(errorHandler);

  //  listen toàn mạng
  app.listen(APP_PORT, "0.0.0.0", () => {
    const localIP = getLocalIP();
    console.log("=========================================");
    console.log(`🚀 Server đang chạy tại:`);
    console.log(` Local:     http://localhost:${APP_PORT}`);
    console.log(` Network:   http://${localIP}:${APP_PORT}`);
    console.log("=========================================");
  });
};

(async () => {
  console.log("Connecting to database...");
  await connectDB();
  console.log("Database connected successfully");
  console.log("Starting server...");
  await START_SERVER();
})();
