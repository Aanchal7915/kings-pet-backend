const mongoose = require('mongoose');

const petFoodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    petType: {
      type: String,
      required: true,
      trim: true,
    },
    foodType: {
      type: String,
      default: '',
      trim: true,
    },
    brand: { type: String, default: '', trim: true },
    weight: { type: String, default: '', trim: true },
    price: { type: Number, required: true, min: 0 },
    bookingAmount: { type: Number, default: 0, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    image: { type: String, default: '' },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

petFoodSchema.index({ petType: 1, isActive: 1 });

module.exports = mongoose.model('PetFood', petFoodSchema);
