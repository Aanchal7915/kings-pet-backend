const mongoose = require('mongoose');

const pincodePricingSchema = new mongoose.Schema(
  {
    pincodes: {
      type: [String],
      default: [],
    },
    packSize: {
      type: String,
      default: '',
    },
    originalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    finalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    stockQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    verifiedLocations: {
      type: [String],
      default: [],
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  brand: {
    type: String,
    default: '',
    trim: true,
  },
  categories: {
    type: [String],
    default: [],
  },
  subCategory: {
    type: String,
    default: '',
  },
  itemType: {
    type: String,
    default: '',
  },
  featured: {
    type: Boolean,
    default: false,
  },
  bestSeller: {
    type: Boolean,
    default: false,
  },
  farmerDetails: {
    name: { type: String, default: '' },
    contact: { type: String, default: '' },
    location: { type: String, default: '' },
    email: { type: String, default: '' },
  },
  pincodePricing: {
    type: [pincodePricingSchema],
    default: [],
  },
  images: {
    type: [String],
    default: [],
  },
  videoUrl: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Product', productSchema);
