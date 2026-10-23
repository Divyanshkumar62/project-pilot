const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 80, // hours per week
    default: 40
  },
  allocations: [{
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    hoursAllocated: {
      type: Number,
      required: true,
      min: 1
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Cancelled'],
      default: 'Active'
    }
  }],
  skills: [{
    type: String,
    trim: true
  }],
  availability: [{
    date: {
      type: Date,
      required: true
    },
    available: {
      type: Boolean,
      default: true
    },
    reason: {
      type: String,
      enum: ['Vacation', 'Sick Leave', 'Training', 'Meeting', 'Other']
    },
    notes: String
  }]
}, {
  timestamps: true
});

resourceSchema.index({ 'allocations.project': 1 });
resourceSchema.index({ 'availability.date': 1 });

module.exports = mongoose.model('Resource', resourceSchema);
