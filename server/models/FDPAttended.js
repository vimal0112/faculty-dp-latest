const mongoose = require('mongoose');

// Helper: format duration from dates - >6 days show weeks, otherwise days
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

const fdpAttendedSchema = new mongoose.Schema({
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  mode: { type: String, enum: ['online', 'offline', 'hybrid'], required: true },
  fromDate: { type: Date },
  toDate: { type: Date },
  duration: { type: String }, // Auto-computed from fromDate/toDate
  venue: { type: String, required: true },
  reportUpload: { type: String },
  proofDoc: { type: String },
  certificate: { type: String }, // PDF, JPG, PNG, DOCX - mandatory for new records (enforced in route)
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

fdpAttendedSchema.pre('save', function () {
  if (this.fromDate && this.toDate) {
    this.duration = formatDuration(this.fromDate, this.toDate);
  }
});

module.exports = mongoose.model('FDPAttended', fdpAttendedSchema);
module.exports.formatDuration = formatDuration;
