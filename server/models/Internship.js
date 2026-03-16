const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  regNo: { type: String, required: true }, // Registration number - mandatory
  studentName: { type: String, required: true },
  companyName: { type: String, required: true },
  companyAddress: { type: String },
  mode: { type: String, enum: ['online', 'offline', 'hybrid'], required: true }, // Mode of internship
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  duration: { type: Number }, // Calculated duration
  durationUnit: { type: String, enum: ['days', 'weeks'] }, // Duration unit
  stipend: { type: Number }, // Optional stipend amount
  description: { type: String },
  skillsGained: [{ type: String }],
  projectTitle: { type: String },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'ongoing', 'completed'],
    default: 'pending'
  },
  feedback: { type: String }, // Feedback by faculty
  feedbackRating: { type: Number, min: 1, max: 5 }, // 5-star rating
  certificate: { type: String, required: true }, // Path to internship certificate - mandatory
  report: { type: String, required: false }, // Path to internship report - optional
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Internship', internshipSchema);
