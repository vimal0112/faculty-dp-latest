const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    autoApproveAll: { type: Boolean, default: false },
    dataRetentionDays: { type: Number, default: 365 },
    maxFileUploadSize: { type: Number, default: 10 },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
