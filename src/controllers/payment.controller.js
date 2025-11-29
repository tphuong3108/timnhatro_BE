
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
    }
};
