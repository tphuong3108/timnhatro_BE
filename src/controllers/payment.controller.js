import moment from "moment";
import qs from "qs";
import crypto from "crypto";
import Payment from "../models/Payment.model.js";
import { vnpayConfig } from "../config/vnpay.js";

export const createPayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    const date = new Date();
    const createDate = moment(date).format("YYYYMMDDHHmmss");
    const txnRef = `TXN${Date.now()}`;

    const clientIP = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1")
      .split(",")[0]
      .trim();

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: vnpayConfig.vnp_TmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: txnRef,
      vnp_OrderInfo:`Thanh toan DH#${orderId}`,
      vnp_OrderType: "billpayment",
      vnp_Amount: parseInt(amount) * 100,
      vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
      vnp_IpAddr: clientIP,
      vnp_CreateDate: createDate,
    };

    vnp_Params = sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(signData, "utf-8").digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;

    const vnpUrl = `${vnpayConfig.vnp_Url}?${qs.stringify(vnp_Params, { encode: true })}`;

    // Lưu DB
    await Payment.create({
      orderId,
      txnRef,
      amount,
      status: "pending",
    });

    res.json({ success: true, paymentUrl: vnpUrl });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const paymentReturn = async (req, res) => {
  try {
    let vnp_Params = req.query;
    const secureHash = vnp_Params.vnp_SecureHash;

    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    vnp_Params = sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: true });
    const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
    const signedCheck = hmac.update(signData, "utf-8").digest("hex");

    if (secureHash !== signedCheck) {
      return res.status(400).json({ success: false, message: "Chữ ký không hợp lệ" });
    }

    const payment = await Payment.findOne({ txnRef: vnp_Params.vnp_TxnRef });
    if (!payment) return res.status(404).json({ success: false, message: "Không tìm thấy giao dịch" });

    payment.bankCode = vnp_Params.vnp_BankCode;
    payment.cardType = vnp_Params.vnp_CardType;
    payment.vnpTxnNo = vnp_Params.vnp_TransactionNo;
    payment.responseCode = vnp_Params.vnp_ResponseCode;
    payment.transactionStatus = vnp_Params.vnp_TransactionStatus;
    payment.payDate = vnp_Params.vnp_PayDate;
    payment.secureHash = secureHash;
    payment.status = vnp_Params.vnp_ResponseCode === "00" ? "success" : "failed";

    await payment.save();

    res.json({ success: true, message: "Thanh toán thành công", data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

function sortObject(obj) {
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
}
