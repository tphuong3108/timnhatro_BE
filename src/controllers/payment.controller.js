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
        status: payment.status,
        orderId: payment.orderId,
        type: payment.type,
        amount: payment.amount,
      });

    } catch (error) {
      console.error("Lỗi check trạng thái:", error);
      return res.status(500).json({ message: "Lỗi hệ thống" });
    }
  },
  async getHostPaymentHistory(req, res) {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      const filter = { userId };

      if (status) filter.status = status;

      const payments = await Payment.find(filter)
        .populate("roomId", "name address isPremium premiumUntil")
        .sort({ createdAt: -1 });

      return res.json({
        success: true,
        data: payments
      });

    } catch (error) {
      console.error("Lỗi lọc lịch sử giao dịch host:", error);
      return res.status(500).json({ message: "Lỗi hệ thống" });
    }
  },
  async getAdminPaymentHistory(req, res) {
    try {
      const { status } = req.query;

      const filter = {};
      if (status) filter.status = status;

      const payments = await Payment.find(filter)
        .populate("userId", "firstName lastName email phoneNumber avatar")
        .populate("roomId", "name address images isPremium premiumUntil")
        .sort({ createdAt: -1 });

      return res.json({
        success: true,
        data: payments
      });

    } catch (error) {
      console.error("Lỗi lọc lịch sử giao dịch admin:", error);
      return res.status(500).json({ message: "Lỗi hệ thống" });
    }
  },

  // Lấy chi tiết thanh toán premium
  async getPaymentDetails(req, res) {
    try {
      const { paymentId } = req.params;

      const payment = await Payment.findById(paymentId)
        .populate("roomId", "name address images isPremium premiumUntil")
        .populate("userId", "firstName lastName email avatar");

      if (!payment) {
        return res.status(404).json({ 
          success: false,
          message: "Không tìm thấy giao dịch" 
        });
      }

      return res.json({
        success: true,
        data: payment
      });

    } catch (error) {
      console.error("Lỗi lấy chi tiết thanh toán:", error);
      return res.status(500).json({ 
        success: false,
        message: "Lỗi hệ thống" 
      });
    }
  }
};
