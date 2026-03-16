const mongoose = require('mongoose');

function formatDuration(fromDate, toDate) {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const diffTime = Math.abs(to.getTime() - from.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  if (diffDays > 6) {
    const weeks = Math.floor(diffDays / 7);
    const remainingDays = diffDays % 7;
    let result = `${weeks} week${weeks > 1 ? 's' : ''}`;
    if (remainingDays > 0) {
      result += ` ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
    }
    return result;
  }
  return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
}

const fdpOrganizedSchema = new mongoose.Schema({
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  mode: { type: String, enum: ['online', 'offline', 'hybrid'], default: 'online' },
  fromDate: { type: Date },
  toDate: { type: Date },
  duration: { type: String },
  venue: { type: String, required: true },
  type: { type: String, enum: ['conference', 'workshop'], required: true },
  certificate: { type: String },
  proofDoc: { type: String },
  report: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

fdpOrganizedSchema.pre('save', function () {
  if (this.fromDate && this.toDate) {
    this.duration = formatDuration(this.fromDate, this.toDate);
  }
});

module.exports = mongoose.model('FDPOrganized', fdpOrganizedSchema);
