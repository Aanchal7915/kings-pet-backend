const mongoose = require('mongoose');

const petListingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    petType: {
      type: String,
      required: true,
      trim: true,
    },
    breed: { type: String, default: '', trim: true },
    age: { type: String, default: '', trim: true },
    gender: { type: String, enum: ['Male', 'Female', 'Unknown'], default: 'Unknown' },
    color: { type: String, default: '', trim: true },
    price: { type: Number, required: true, min: 0 },
    bookingAmount: { type: Number, default: 0, min: 0 },
    vaccinated: { type: Boolean, default: false },
    dewormed: { type: Boolean, default: false },
    image: { type: String, default: '' },
    images: { type: [String], default: [] },
    description: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

petListingSchema.index({ petType: 1, isActive: 1, isAvailable: 1 });

module.exports = mongoose.model('PetListing', petListingSchema);
