import { paymentService } from "../services/payment.service.js";
import { Payment } from "../models/Payment.model.js";

export const paymentController = {
  async createPremiumPaymentUrl(req, res) {
    try {
      const { paymentUrl, orderId } = await paymentService.createPremiumPaymentUrl(req);
      return res.json({ paymentUrl, orderId });
    } catch (error) {
      console.error("Lỗi tạo URL thanh toán premium:", error);
      return res.status(500).json({ message: "Lỗi tạo URL thanh toán" });
    }
  },

 async returnPremiumPayment(req, res) {
  try {
    const verify = await paymentService.handleReturnUrl(req.query);
    console.log("Premium payment verify:", verify);
    const orderId = req.query.vnp_TxnRef;
    return res.redirect(`${process.env.VNP_RESULT_HTML_PREMIUM}?orderId=${orderId}`);

  } catch (error) {
    console.error("Lỗi xác thực VNPay premium:", error);
    return res.redirect(`${process.env.VNP_RESULT_HTML_PREMIUM}?error=true`);
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
