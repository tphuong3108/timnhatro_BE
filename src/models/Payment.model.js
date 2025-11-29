import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },       // Mã đơn hàng trong hệ thống bạn
    txnRef: { type: String, required: true, unique: true }, // vnp_TxnRef
    amount: { type: Number, required: true },        // Số tiền (VND)
    description: { type: String },

    // Thông tin VNPay trả về
    bankCode: { type: String },
    cardType: { type: String },
    vnpTxnNo: { type: String },
    responseCode: { type: String },
    transactionStatus: { type: String },
    payDate: { type: String },

    secureHash: { type: String },
    ipAddr: { type: String },

    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'canceled'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

PaymentSchema.index({ txnRef: 1 });
PaymentSchema.index({ orderId: 1 });

module.exports = mongoose.model('Payment', PaymentSchema);
