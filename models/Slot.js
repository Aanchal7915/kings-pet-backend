const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      default: 1,
      min: 1,
    },
    bookedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      default: null,
    },
  },
  { timestamps: true }
);

slotSchema.index({ date: 1, startTime: 1, endTime: 1, service: 1 });

slotSchema.virtual('availableCount').get(function availableCount() {
  return Math.max(this.capacity - this.bookedCount, 0);
});

slotSchema.virtual('startAt').get(function startAt() {
  const isoDate = new Date(this.date).toISOString().slice(0, 10);
  return new Date(`${isoDate}T${this.startTime}:00`);
});

slotSchema.virtual('endAt').get(function endAt() {
  const isoDate = new Date(this.date).toISOString().slice(0, 10);
  return new Date(`${isoDate}T${this.endTime}:00`);
});

slotSchema.set('toJSON', { virtuals: true });
slotSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Slot', slotSchema);
