const express = require('express');
const router = express.Router();
const User = require('../models/User');
const FDPAttended = require('../models/FDPAttended');
const FDPOrganized = require('../models/FDPOrganized');
const Seminar = require('../models/Seminar');
const ABL = require('../models/ABL');
const JointTeaching = require('../models/JointTeaching');
const AdjunctFaculty = require('../models/AdjunctFaculty');
const Notification = require('../models/Notification');
const Event = require('../models/Event');
const FDPReimbursement = require('../models/FDPReimbursement');
const Achievement = require('../models/Achievement');
const Internship = require('../models/Internship');
const SystemSettings = require('../models/SystemSettings');

// Middleware to check admin role
const checkAdmin = async (req, res, next) => {
  try {
    const userId = req.headers['user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }
    next();
  } catch (error) {
    next(error);
  }
};

// ========== Faculty Management ==========
router.get('/faculty', checkAdmin, async (req, res) => {
  try {
    const faculty = await User.find({ role: 'faculty' })
      .select('-password')
      .populate('department')
      .sort({ createdAt: -1 });
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/faculty/:id', checkAdmin, async (req, res) => {
  try {
    const faculty = await User.findById(req.params.id).select('-password');
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ error: 'Faculty not found' });
    }
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== User Management / Recipients ==========
router.get('/recipients', checkAdmin, async (req, res) => {
  try {
    const recipients = await User.find({ role: { $in: ['faculty', 'hod'] } })
      .select('name email role department')
      .sort({ name: 1 });
    res.json(recipients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== FDP Attended Management ==========
router.get('/fdp/attended', checkAdmin, async (req, res) => {
  try {
    const records = await FDPAttended.find()
      .populate('facultyId', 'name email department')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/fdp/attended/:id/status', checkAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const record = await FDPAttended.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    ).populate('facultyId', 'name email');

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Create notification
    await Notification.create({
      recipientId: record.facultyId._id,
      sender: 'Admin',
      message: `Your FDP record "${record.title}" has been ${status}`,
      type: status === 'approved' ? 'success' : 'info',
    });

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== FDP Organized Management ==========
router.get('/fdp/organized', checkAdmin, async (req, res) => {
  try {
    const records = await FDPOrganized.find()
      .populate('facultyId', 'name email department')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/fdp/organized/:id/status', checkAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const record = await FDPOrganized.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    ).populate('facultyId', 'name email');

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Create notification
    await Notification.create({
      recipientId: record.facultyId._id,
      sender: 'Admin',
      message: `Your organized FDP "${record.title}" has been ${status}`,
      type: status === 'approved' ? 'success' : 'info',
    });

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Seminars Management ==========
router.get('/seminars', checkAdmin, async (req, res) => {
  try {
    const records = await Seminar.find()
      .populate('facultyId', 'name email department')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/seminars/:id/status', checkAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const record = await Seminar.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    ).populate('facultyId', 'name email');

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Create notification
    await Notification.create({
      recipientId: record.facultyId._id,
      sender: 'Admin',
      message: `Your seminar "${record.title}" has been ${status}`,
      type: status === 'approved' ? 'success' : 'info',
    });

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ABL Management ==========
router.get('/abl', checkAdmin, async (req, res) => {
  try {
    const records = await ABL.find()
      .populate('facultyId', 'name email department')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/abl/:id/status', checkAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const record = await ABL.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    ).populate('facultyId', 'name email');

    if (!record) {
      return res.status(404).json({ error: 'ABL record not found' });
    }

    // Create notification for faculty
    await Notification.create({
      recipientId: record.facultyId._id,
      sender: 'Admin',
      message: `Your ABL report for ${record.subjectName} has been ${status}`,
      type: status === 'approved' ? 'success' : 'warning',
    });

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Joint Teaching Management ==========
router.get('/joint-teaching', checkAdmin, async (req, res) => {
  try {
    const records = await JointTeaching.find()
      .populate('facultyId', 'name email department')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/joint-teaching/:id/status', checkAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const record = await JointTeaching.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    ).populate('facultyId', 'name email');

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Create notification
    await Notification.create({
      recipientId: record.facultyId._id,
      sender: 'Admin',
      message: `Your Joint Teaching record for "${record.courseName}" has been ${status}`,
      type: status === 'approved' ? 'success' : 'info',
    });

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Adjunct Faculty Management ==========
router.get('/adjunct', checkAdmin, async (req, res) => {
  try {
    const records = await AdjunctFaculty.find()
      .populate('facultyId', 'name email department')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/adjunct/:id/status', checkAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const record = await AdjunctFaculty.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    ).populate('facultyId', 'name email');

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Create notification
    await Notification.create({
      recipientId: record.facultyId._id,
      sender: 'Admin',
      message: `Your Adjunct Faculty record "${record.facultyName}" has been ${status}`,
      type: status === 'approved' ? 'success' : 'info',
    });

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Events Management ==========
router.get('/events', checkAdmin, async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/events', checkAdmin, async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/events/:id', checkAdmin, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/events/:id', checkAdmin, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Notifications Management ==========
router.get('/notifications', checkAdmin, async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate('recipientId', 'name email')
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/notifications', checkAdmin, async (req, res) => {
  try {
    const { recipientId, message, type } = req.body;
    const notification = new Notification({
      recipientId,
      sender: 'Admin',
      message,
      type: type || 'info',
    });
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/notifications/:id', checkAdmin, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/notifications/read-all', checkAdmin, async (req, res) => {
  try {
    // Admin reading all notifications meant for them? Let's mark all unread notifications as read. 
    // Wait, the notifications in AdminNotifications.tsx are basically all notifications in the system or sent to admin? 
    // The previous GET /notifications returns ALL notifications: `Notification.find().populate('recipientId'...`
    // If the admin is marking all as read, they are probably marking ALL system notifications as read for themselves, or rather just all of them.
    // Let's just update all where read is false.
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/notifications/:id/read', checkAdmin, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== System Settings Management ==========
router.get('/settings', checkAdmin, async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      // Return default settings if none exist
      settings = await SystemSettings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/settings', checkAdmin, async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings(req.body);
    } else {
      Object.assign(settings, req.body, { updatedAt: Date.now() });
    }
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Admin Profile Management ==========
router.put('/profile', checkAdmin, async (req, res) => {
  try {
    const userId = req.headers['user-id'];
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name },
      { new: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Dashboard Stats ==========
router.get('/dashboard', checkAdmin, async (req, res) => {
  try {
    const [
      totalFaculty,
      pendingFDPs,
      approvedFDPs,
      totalSeminars,
      totalABL,
      totalJointTeaching,
      totalAdjunct,
    ] = await Promise.all([
      User.countDocuments({ role: 'faculty' }),
      FDPAttended.countDocuments({ status: 'pending' }) + FDPOrganized.countDocuments({ status: 'pending' }),
      FDPAttended.countDocuments({ status: 'approved' }) + FDPOrganized.countDocuments({ status: 'approved' }),
      Seminar.countDocuments(),
      ABL.countDocuments(),
      JointTeaching.countDocuments(),
      AdjunctFaculty.countDocuments(),
    ]);

    res.json({
      stats: {
        totalFaculty,
        pendingFDPs,
        approvedFDPs,
        totalSeminars,
        totalABL,
        totalJointTeaching,
        totalAdjunct,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== FDP Reimbursement Management ==========
router.get('/reimbursements', checkAdmin, async (req, res) => {
  try {
    const records = await FDPReimbursement.find()
      .populate('facultyId', 'name email department')
      .populate('fdpId', 'title')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/reimbursements/:id/status', checkAdmin, async (req, res) => {
  try {
    const userId = req.headers['user-id'];
    const { status, reviewComments } = req.body;

    if (!['pending', 'approved', 'rejected', 'processed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = {
      status,
      reviewedBy: userId,
      reviewedDate: Date.now(),
      updatedAt: Date.now(),
    };

    if (status === 'processed') {
      updateData.processedDate = Date.now();
    }

    if (reviewComments) {
      updateData.reviewComments = reviewComments;
    }

    const record = await FDPReimbursement.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('facultyId', 'name email')
      .populate('fdpId', 'title');

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Create notification
    await Notification.create({
      recipientId: record.facultyId._id,
      sender: 'Admin',
      message: `Your reimbursement request for "${record.fdpTitle}" has been ${status}`,
      type: status === 'approved' || status === 'processed' ? 'success' : 'info',
    });

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Achievement Management ==========
router.get('/achievements', checkAdmin, async (req, res) => {
  try {
    const records = await Achievement.find()
      .populate('facultyId', 'name email department')
      .populate('verifiedBy', 'name')
      .sort({ date: -1, createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/achievements/:id/verify', checkAdmin, async (req, res) => {
  try {
    const userId = req.headers['user-id'];
    const { status } = req.body;

    if (!['pending', 'verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = {
      status,
      verifiedBy: userId,
      verifiedDate: Date.now(),
      updatedAt: Date.now(),
    };

    const record = await Achievement.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('facultyId', 'name email');

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Create notification
    await Notification.create({
      recipientId: record.facultyId._id,
      sender: 'Admin',
      message: `Your achievement "${record.title}" has been ${status}`,
      type: status === 'verified' ? 'success' : 'info',
    });

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Internship Management ==========
router.get('/internships', checkAdmin, async (req, res) => {
  try {
    const records = await Internship.find()
      .populate('facultyId', 'name email department')
      .sort({ startDate: -1, createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/internships/:id/status', checkAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const record = await Internship.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    ).populate('facultyId', 'name email');

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Create notification for faculty
    await Notification.create({
      recipientId: record.facultyId._id,
      sender: 'Admin',
      message: `Your internship record has been ${status}`,
      type: status === 'approved' ? 'success' : 'info'
    });

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== User Control Management ==========
router.get('/users', checkAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-password')
      .sort({ name: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:id/status', checkAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
