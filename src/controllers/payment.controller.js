
import { paymentService } from "../services/payment.service.js";

export const paymentController = {
    async createPaymentUrl(req, res) {
        try {
            const { paymentUrl } = await paymentService.createPaymentUrl(req);
            return res.json({ paymentUrl });
        } catch (error) {
            console.error("Lỗi tạo URL thanh toán:", error);
            return res.status(500).json({ message: "Lỗi tạo URL thanh toán" });
        }
    },
    async createPremiumPaymentUrl(req, res) {
        try {
            const { paymentUrl } = await paymentService.createPremiumPaymentUrl(req);
            return res.json({ paymentUrl ,orderId: vnp_TxnRef });
        } catch (error) {
            console.error("Lỗi tạo URL thanh toán premium:", error);
            return res.status(500).json({ message: "Lỗi tạo URL thanh toán" });
        }
    },

    async returnPayment(req, res) {
        try {
            const verify = await paymentService.handleReturnUrl(req.query);
            console.log(verify);
            if (verify.isSuccess) {
                return res.json({
                    message: "Thanh toán thành công",
                    data: verify.data,

                });
            }

            return res.json({
                message: "Thanh toán thất bại",
                data: verify.message
            });
        } catch (error) {
            console.error("Lỗi xác thực VNPay:", error);
            return res.status(500).json({ message: "Xác thực lỗi" });
        }
    },

    async returnPremiumPayment(req, res) {
        try {
            const verify = await paymentService.handlePremiumReturnUrl(req.query);
            console.log("Premium payment verify:", verify);
            if (verify.isSuccess) {
                return res.json({
                    message: "Thanh toán premium thành công",
                    data: verify.data,
                });
            }

            return res.json({
                message: "Thanh toán premium thất bại",
                data: verify.message
            });
        } catch (error) {
            console.error("Lỗi xác thực VNPay premium:", error);
            return res.status(500).json({ message: "Xác thực lỗi" });
        }
    },
    async checkPaymentStatus(req, res) {
    try {
        const { orderId } = req.query;

        if (!orderId) {
            return res.status(400).json({ message: "Thiếu orderId" });
        }

        const payment = await Payment.findOne({ orderId });

        if (!payment) {
            return res.status(404).json({ message: "Không tìm thấy giao dịch" });
        }

        return res.json({
            status: payment.status,     // pending / success / failed
            orderId: payment.orderId,
            type: payment.type,
            amount: payment.amount,
        });

    } catch (error) {
        console.error("Lỗi check trạng thái:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
}

};
