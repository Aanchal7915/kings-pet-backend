const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: String, default: 'admin' },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const rescheduleHistorySchema = new mongoose.Schema(
  {
    fromSlot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
    toSlot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
    at: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, unique: true, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      petName: { type: String, required: true, trim: true },
      petType: { type: String, required: true, trim: true },
      petBreed: { type: String, default: '', trim: true },
    },
    service: {
      ref: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
      name: { type: String, required: true },
    },
    variant: {
      name: { type: String, required: true },
      fullPrice: { type: Number, required: true, min: 0 },
    },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
    advancePaid: { type: Number, required: true, min: 0 },
    remainingAmount: { type: Number, required: true, min: 0 },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String, required: true },
    paymentStatus: {
      type: String,
      enum: ['advance_paid', 'fully_paid', 'refunded'],
      default: 'advance_paid',
    },
    bookingStatus: {
      type: String,
      enum: ['confirmed', 'completed', 'rejected', 'cancelled', 'cancelled_refunded', 'rejected_refunded'],
      default: 'confirmed',
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
    adminNote: { type: String, default: '' },
    rescheduleHistory: { type: [rescheduleHistorySchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model('Booking', bookingSchema);
