const mongoose = require('mongoose');

const pageContentSchema = new mongoose.Schema(
  {
    page: {
      type: String,
      enum: ['about', 'doctors'],
      required: true,
      index: true,
    },
    section: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

pageContentSchema.index({ page: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('PageContent', pageContentSchema);
