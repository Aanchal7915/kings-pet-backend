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

const petOrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true, required: true },
    orderType: { type: String, enum: ['food', 'pet'], required: true },

    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, default: '', trim: true },
      address: { type: String, default: '', trim: true },
      city: { type: String, default: '', trim: true },
    },

    item: {
      ref: { type: mongoose.Schema.Types.ObjectId, required: true },
      refModel: { type: String, enum: ['PetFood', 'PetListing'], required: true },
      name: { type: String, required: true },
      image: { type: String, default: '' },
      petType: { type: String, default: '' },
      breed: { type: String, default: '' },
    },

    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    bookingAmount: { type: Number, default: 0, min: 0 },
    remainingAmount: { type: Number, default: 0, min: 0 },

    message: { type: String, default: '' },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
    adminNote: { type: String, default: '' },
  },
  { timestamps: true }
);

petOrderSchema.index({ orderType: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('PetOrder', petOrderSchema);
