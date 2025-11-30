// routes/payment.route.js
import express from "express";
import { vnpay } from "../config/vnpay.js";
import { dateFormat } from "vnpay/utils";
const router = express.Router();

/**
 * 1️⃣ Tạo URL thanh toán
 */
router.get("/create", async (req, res) => {
    try {
        const orderId = "ORDER_" + Date.now();

        const paymentUrl = vnpay.buildPaymentUrl({
            vnp_Amount: 100 * 100, // VNPay yêu cầu nhân 100
            vnp_IpAddr: req.headers["x-forwarded-for"] || req.connection.remoteAddress || "113.190.251.2",
            vnp_ReturnUrl: process.env.VNP_RETURN_URL,
            vnp_TxnRef: orderId,
            vnp_OrderInfo: `Thanh toán đơn hàng #${orderId}`,
             vnp_Version: "2.1.0",
            vnp_Command: "pay",
            vnp_OrderType: "other",
            vnp_Locale: "vn",
            vnp_CurrCode: "VND",
            vnp_CreateDate: dateFormat(new Date()),
        });

        return res.json({ paymentUrl });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Lỗi tạo URL thanh toán" });
    }
});

/**
 * 2️⃣ VNPay redirect về URL này sau khi thanh toán
 */
router.get("/return", (req, res) => {
    try {
        const verify = vnpay.verifyReturnUrl(req.query);

        if (verify.isSuccess) {
            return res.json({
                message: "Thanh toán thành công",
                data: verify.data,
            });
        }

        return res.json({
            message: "Thanh toán thất bại",
            data: verify.message,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Xác thực lỗi" });
    }
});

export default router;
