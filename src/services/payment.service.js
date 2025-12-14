// services/payment.service.js
import { vnpay } from "../config/vnpay.js";
import { dateFormat } from "vnpay/utils";
import dotenv from "dotenv";
import { Payment } from "../models/Payment.model.js";
import { notificationService } from "./notification.service.js";
import  RoomModel  from "../models/Room.model.js";
dotenv.config();

export const paymentService = {
    async createPremiumPaymentUrl(req) {
  const { roomId, durationDays } = req.body;
  const userId = req.user.id;
  
  // Kiểm tra phòng có tồn tại & thuộc về user
  const room = await RoomModel.findOne({ _id: roomId, createdBy: userId });
  if (!room) throw new Error("Phòng không tồn tại");
  
  const priceMap = { 30: 50000, 60: 90000, 90: 120000 };
  const amount = priceMap[durationDays];
  
  const orderId = `PREMIUM_${roomId}_${Date.now()}`;

  const paymentUrl = vnpay.buildPaymentUrl({
    vnp_Amount: amount * 100,
    vnp_IpAddr: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    vnp_ReturnUrl: process.env.VNP_RETURN_URL,
    vnp_TxnRef: orderId,
    vnp_OrderInfo: `Nâng cấp phòng ưu tiên: ${room.name}`,
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_CreateDate: dateFormat(new Date()),

  });

  await Payment.create({
    orderId,
    txnRef: orderId,
    amount,
    userId,
    roomId,  
    type: 'premium',
    premiumDuration: durationDays,
    description: `Premium room upgrade: ${room.name}`,
    status: 'pending'
  });
  
  return { paymentUrl, orderId };
},
 async createPaymentUrl(req) {
        const { amount, orderId: clientOrderId, description } = req.body;
        if (!amount || isNaN(amount) || amount <= 0) {
            throw new Error("Số tiền không hợp lệ");
        }

       
        const orderId = clientOrderId || "ORDER_" + Date.now();

        const paymentUrl = vnpay.buildPaymentUrl({
            vnp_Amount: amount * 100,       // VNPay yêu cầu nhân 100
            vnp_IpAddr:
                req.headers["x-forwarded-for"] ||
                req.connection.remoteAddress ||
                "113.190.251.2",
            vnp_ReturnUrl: process.env.VNP_RETURN_URL,
            vnp_TxnRef: orderId,
            vnp_OrderInfo: description || `Thanh toán đơn hàng #${orderId}`,
            vnp_Version: "2.1.0",
            vnp_Command: "pay",
            vnp_OrderType: "other",
            vnp_Locale: "vn",
            vnp_CurrCode: "VND",
            vnp_CreateDate: dateFormat(new Date()),
        });
        await Payment.create({
            orderId,
            txnRef: orderId,
            amount,
            description,
            status: "pending"
        });
        return { paymentUrl, orderId };
    },
async handleReturnUrl(query) {
  const verify = vnpay.verifyReturnUrl(query);
  const { vnp_TxnRef } = query;
  
  const payment = await Payment.findOne({ txnRef: vnp_TxnRef });
  
  if (!payment) throw new Error("Không tìm thấy payment");
  
  if (verify.isSuccess && payment.type === 'premium') {
    const premiumUntil = new Date();
    premiumUntil.setDate(premiumUntil.getDate() + payment.premiumDuration);
    
    await RoomModel.findByIdAndUpdate(payment.roomId, {
      isPremium: true,
      premiumUntil,
      premiumPaymentId: payment._id
    });
    
    await notificationService.createNew({
      userId: room.createdBy,
      role: 'host',
      type: 'room:premium_activated',
      title: 'Kích hoạt phòng ưu tiên thành công',
      message: `Phòng "${room.name}" đã được nâng cấp đến ${premiumUntil}`
    });
  }
  
  payment.status = verify.isSuccess ? 'success' : 'failed';
  await payment.save();
  
  return verify;
},
   async handleReturnUrl(query) {
    const verify = vnpay.verifyReturnUrl(query);
    const { vnp_TxnRef, vnp_ResponseCode, vnp_TransactionStatus } = query;

    const payment = await Payment.findOne({ txnRef: vnp_TxnRef });
    if (!payment) throw new Error("Không tìm thấy payment trong hệ thống");

    // Cập nhật trạng thái
    payment.status = verify.isSuccess ? "success" : "failed";
    payment.responseCode = vnp_ResponseCode;
    payment.transactionStatus = vnp_TransactionStatus;
    payment.bankCode = query.vnp_BankCode;
    payment.cardType = query.vnp_CardType;
    payment.vnpTxnNo = query.vnp_TransactionNo;
    payment.payDate = query.vnp_PayDate;
    payment.secureHash = query.vnp_SecureHash;
    await payment.save();
    if (verify.isSuccess && payment.type === "premium") {
      const room = await RoomModel.findById(payment.roomId);

      if (room) {
        const premiumUntil = new Date();
        premiumUntil.setDate(
          premiumUntil.getDate() + payment.premiumDuration
        );

        await RoomModel.findByIdAndUpdate(room._id, {
          isPremium: true,
          premiumUntil,
          premiumPaymentId: payment._id,
        });

        // Gửi thông báo
        await notificationService.createNew({
          userId: room.createdBy,
          role: "host",
          type: "room:premium_activated",
          title: "Kích hoạt phòng ưu tiên thành công",
          message: `Phòng "${room.name}" đã nâng cấp Premium đến ngày ${premiumUntil.toLocaleDateString()}`,
        });
      }
    }


      await notificationService.createNew({
      userId: payment.userId,
      title: verify.isSuccess
        ? "Thanh toán thành công"
        : "Thanh toán thất bại",
      message: verify.isSuccess
        ? `Bạn đã thanh toán thành công đơn hàng #${payment.orderId} với số tiền ${payment.amount} VND`
        : `Thanh toán đơn hàng #${payment.orderId} thất bại. Vui lòng thử lại.`,
      type: verify.isSuccess ? "payment:success" : "payment:failed",
      referenceId: payment._id,
      referenceType: "payment",
    });

    return verify;
  },
};
