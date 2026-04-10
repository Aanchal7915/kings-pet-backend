const mongoose = require('mongoose');

const rescheduleHistorySchema = new mongoose.Schema(
  {
    fromSlot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
    toSlot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, default: '', trim: true },
    },
    pet: {
      name: { type: String, default: '', trim: true },
      type: { type: String, default: '', trim: true },
      breed: { type: String, default: '', trim: true },
    },

    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    variant: {
      name: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
      bookingAmount: { type: Number, required: true, min: 0 },
    },

    slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },

    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'refunded'],
      default: 'pending',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'refunded'],
      default: 'pending',
    },

    rescheduleHistory: {
      type: [rescheduleHistorySchema],
      default: [],
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [{ status: 'pending', note: 'Booking created' }],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
