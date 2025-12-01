// services/payment.service.js
import { vnpay } from "../config/vnpay.js";
import { dateFormat } from "vnpay/utils";
import dotenv from "dotenv";
import { Payment } from "../models/Payment.model.js";
import { notificationService } from "./notification.service.js";
dotenv.config();

export const paymentService = {
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
        console.log(verify);
        const { vnp_TxnRef, vnp_ResponseCode, vnp_TransactionStatus } = query;

        const payment = await Payment.findOne({ txnRef: vnp_TxnRef });

        if (!payment) {
            throw new Error("Không tìm thấy payment trong hệ thống");
        }
        if (verify.isSuccess) {
            payment.status = "success";
        } else {
            payment.status = "failed";
        }

        payment.responseCode = vnp_ResponseCode;
        payment.transactionStatus = vnp_TransactionStatus;
        payment.bankCode = query.vnp_BankCode;
        payment.cardType = query.vnp_CardType;
        payment.vnpTxnNo = query.vnp_TransactionNo;
        payment.payDate = query.vnp_PayDate;
        payment.secureHash = query.vnp_SecureHash;

        await payment.save();

        // --- Thêm thông báo ---
        await notificationService.createNew({
            userId: payment.userId,
            title: verify.isSuccess ? "Thanh toán thành công" : "Thanh toán thất bại",
            message: verify.isSuccess
              ? `Bạn đã thanh toán thành công đơn hàng #${payment.orderId} với số tiền ${payment.amount} VND`
              : `Thanh toán đơn hàng #${payment.orderId} không thành công. Vui lòng thử lại.`,
            type: verify.isSuccess ? "payment:success" : "payment:failed",
            referenceId: payment._id,
            referenceType: 'payment'
        });
        return verify;
    }
};
