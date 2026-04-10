const mongoose = require('mongoose');

const slugify = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const subCategorySchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Subcategory name is required'],
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

subCategorySchema.index({ category: 1, name: 1 }, { unique: true });
subCategorySchema.index({ category: 1, slug: 1 }, { unique: true, sparse: true });

subCategorySchema.pre('validate', function onValidate() {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
});

module.exports = mongoose.model('SubCategory', subCategorySchema);
