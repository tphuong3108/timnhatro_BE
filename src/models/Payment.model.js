import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    txnRef: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    description: { type: String },

    // Info trả về từ VNPay
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
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    roomId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'rooms' 
        },
      userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true
    },

    type: {
      type: String,
      enum: ['booking', 'premium'],
      default: 'booking'
    },
    premiumDuration: { 
      type: Number, 
      default: null
    }
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", PaymentSchema);
