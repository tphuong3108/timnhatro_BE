import express from "express";
import cors from "cors";
import { connectDB } from "~/config/db.js";
import { env } from "~/config/environment.js";
import { APIs } from "~/routes/index.js";
import { errorHandler } from "~/middlewares/error.middleware.js";
import os from "os";
import { setupChatSocket } from "~/sockets/chat.socket.js";
import { createServer } from "http";
import { Server } from "socket.io";
import paymentRoutes from "./routes/payment.routes.js";
const APP_PORT = env.APP_PORT || 5050;

// const {VNPay, ignoreLogger, ProductCode,VnpLocale, dateFormat} = require('vnpay')
 

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
      origin: "*", // có thể cấu hình lại domain FE sau này
    },
  });
  app.set("io", io);
  setupChatSocket(io);
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/payment", paymentRoutes);
  // app.post("/api/create-qr", async (req, res) => {
  //   try {
  //     const vnpay = new VNPay({
  //       tmnCode: "",
  //       secureSecret: "",
  //       vnpayHost: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  //       testMode: true,
  //       hashAlgorithm: "SHA512",
  //       LoggerFn: ignoreLogger,
  //     });

  //     const tomorrow = new Date();
  //     tomorrow.setDate(tomorrow.getDate() + 1);
  //     const amount = 50000 * 100;
  //     const vnpayResponse = await vnpay.buildPaymentUrl({
  //       vnp_Version: "2.1.0",       // BẮT BUỘC
  //       vnp_Command: "pay",         // BẮT BUỘC
  //       vnp_TmnCode: "Z9J9XGQB",       // BẮT BUỘC
  //       vnp_Amount: amount,         // BẮT BUỘC
  //       vnp_CurrCode: "VND",
  //       // vnp_Amount: 50000,
  //       vnp_IpAddr: "127.0.0.1",
  //       vnp_TxnRef: Date.now().toString(),
  //       vnp_OrderInfo: "Thanh toán test",
  //       vnp_OrderType: ProductCode.Other,
  //       vnp_ReturnUrl: "http://localhost:5050/api/check-payment-vnpay",
  //       vnp_Locale: VnpLocale.VN,
  //       vnp_CreateDate: dateFormat(new Date()),
  //       vnp_ExpireDate: dateFormat(tomorrow),
  //     });

  //     return res.status(201).json(vnpayResponse);
  //   } catch (err) {
  //     console.error(err);
  //     return res.status(500).json({ error: err.message });
  //   }
  // });

  // // Route nhận kết quả thanh toán
  // app.get("/api/check-payment-vnpay", (req, res) => {
  //   return res.json({
  //     message: "VNPay return data",
  //     data: req.query,
  //   });
  // });
  app.use("/api", APIs);
  app.use(errorHandler);

  //  listen toàn mạng
  httpServer.listen(APP_PORT, "0.0.0.0", () => {
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
