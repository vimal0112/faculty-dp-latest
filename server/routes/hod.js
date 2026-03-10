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

// Middleware to check HOD role
const checkHOD = async (req, res, next) => {
  try {
    const userId = req.headers['user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await User.findById(userId);
    if (!user || user.role !== 'hod') {
      return res.status(403).json({ error: 'Forbidden - HOD access required' });
    }
    req.hodDepartment = user.department;
    next();
  } catch (error) {
    next(error);
  }
};

// ========== Faculty Management ==========
router.get('/faculty', checkHOD, async (req, res) => {
  try {
    const faculty = await User.find({
      role: 'faculty',
    })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/faculty/:id', checkHOD, async (req, res) => {
  try {
    const faculty = await User.findById(req.params.id).select('-password');
    if (!faculty || faculty.role !== 'faculty' || faculty.department !== req.hodDepartment) {
      return res.status(404).json({ error: 'Faculty not found' });
    }
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Records Management ==========
router.get('/records', checkHOD, async (req, res) => {
  try {
    const departmentFaculty = await User.find({
      role: 'faculty',
      department: req.hodDepartment,
    }).select('_id');

    const facultyIds = departmentFaculty.map(f => f._id);

    const [fdpAttended, fdpOrganized, seminars, abl, jointTeaching, adjunct] = await Promise.all([
      FDPAttended.find({ facultyId: { $in: facultyIds } })
        .populate('facultyId', 'name email')
        .sort({ createdAt: -1 }),
      FDPOrganized.find({ facultyId: { $in: facultyIds } })
        .populate('facultyId', 'name email')
        .sort({ createdAt: -1 }),
      Seminar.find({ facultyId: { $in: facultyIds } })
        .populate('facultyId', 'name email')
        .sort({ createdAt: -1 }),
      ABL.find({ facultyId: { $in: facultyIds } })
        .populate('facultyId', 'name email')
        .sort({ createdAt: -1 }),
      JointTeaching.find({ facultyId: { $in: facultyIds } })
        .populate('facultyId', 'name email')
        .sort({ createdAt: -1 }),
      AdjunctFaculty.find({ facultyId: { $in: facultyIds } })
        .populate('facultyId', 'name email')
        .sort({ createdAt: -1 }),
    ]);

    res.json({
      fdpAttended,
      fdpOrganized,
      seminars,
      abl,
      jointTeaching,
      adjunct,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Analytics ==========
router.get('/analytics', checkHOD, async (req, res) => {
  try {
    const departmentFaculty = await User.find({
      role: 'faculty',
      department: req.hodDepartment,
    }).select('_id');

    const facultyIds = departmentFaculty.map(f => f._id);

    const [
      totalFaculty,
      totalFDPAttended,
      totalFDPOrganized,
      totalSeminars,
      totalABL,
      totalJointTeaching,
      totalAdjunct,
      pendingFDPs,
      approvedFDPs,
    ] = await Promise.all([
      User.countDocuments({ role: 'faculty', department: req.hodDepartment }),
      FDPAttended.countDocuments({ facultyId: { $in: facultyIds } }),
      FDPOrganized.countDocuments({ facultyId: { $in: facultyIds } }),
      Seminar.countDocuments({ facultyId: { $in: facultyIds } }),
      ABL.countDocuments({ facultyId: { $in: facultyIds } }),
      JointTeaching.countDocuments({ facultyId: { $in: facultyIds } }),
      AdjunctFaculty.countDocuments({ facultyId: { $in: facultyIds } }),
      FDPAttended.countDocuments({ facultyId: { $in: facultyIds }, status: 'pending' }) +
      FDPOrganized.countDocuments({ facultyId: { $in: facultyIds }, status: 'pending' }),
      FDPAttended.countDocuments({ facultyId: { $in: facultyIds }, status: 'approved' }) +
      FDPOrganized.countDocuments({ facultyId: { $in: facultyIds }, status: 'approved' }),
    ]);

    // Get FDPs by month for the last 12 months
    const monthlyFDPs = await FDPAttended.aggregate([
      { $match: { facultyId: { $in: facultyIds } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);

    // Get top performing faculty (Combined FDP Attended and Organized)
    const [topAttended, topOrganized] = await Promise.all([
      FDPAttended.aggregate([
        { $match: { facultyId: { $in: facultyIds } } },
        { $group: { _id: '$facultyId', count: { $sum: 1 } } }
      ]),
      FDPOrganized.aggregate([
        { $match: { facultyId: { $in: facultyIds } } },
        { $group: { _id: '$facultyId', count: { $sum: 1 } } }
      ])
    ]);

    const facultyStats = new Map();
    topAttended.forEach(f => facultyStats.set(f._id.toString(), (facultyStats.get(f._id.toString()) || 0) + f.count));
    topOrganized.forEach(f => facultyStats.set(f._id.toString(), (facultyStats.get(f._id.toString()) || 0) + f.count));

    const sortedFacultyIds = Array.from(facultyStats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topFaculty = await Promise.all(sortedFacultyIds.map(async ([id, count]) => {
      const faculty = await User.findById(id).select('-password');
      return {
        _id: id,
        count,
        faculty: [faculty] // Keeping the structure expected by frontend
      };
    }));

    res.json({
      overview: {
        totalFaculty,
        totalFDPAttended,
        totalFDPOrganized,
        totalSeminars,
        totalABL,
        totalJointTeaching,
        totalAdjunct,
        pendingFDPs,
        approvedFDPs,
      },
      monthlyFDPs,
      topFaculty,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Notifications ==========
router.get('/notifications', checkHOD, async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { recipientId: req.headers['user-id'] },
        { sender: 'Admin' }
      ]
    })
      .populate('recipientId', 'name role')
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark as read
router.put('/notifications/:id/read', checkHOD, async (req, res) => {
  try {
    const userId = req.headers['user-id'];
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [
          { recipientId: userId },
          { sender: 'Admin' }
        ]
      },
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

// Mark all as read
router.put('/notifications/read-all', checkHOD, async (req, res) => {
  try {
    const userId = req.headers['user-id'];
    await Notification.updateMany(
      {
        read: false,
        $or: [
          { recipientId: userId },
          { sender: 'Admin' }
        ]
      },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Dashboard ==========
router.get('/dashboard', checkHOD, async (req, res) => {
  try {
    const departmentFaculty = await User.find({
      role: 'faculty',
      department: req.hodDepartment,
    }).select('_id');

    const facultyIds = departmentFaculty.map(f => f._id);

    const [
      totalFaculty,
      pendingFDPs,
      approvedFDPs,
      totalSeminars,
    ] = await Promise.all([
      User.countDocuments({ role: 'faculty', department: req.hodDepartment }),
      FDPAttended.countDocuments({ facultyId: { $in: facultyIds }, status: 'pending' }) +
      FDPOrganized.countDocuments({ facultyId: { $in: facultyIds }, status: 'pending' }),
      FDPAttended.countDocuments({ facultyId: { $in: facultyIds }, status: 'approved' }) +
      FDPOrganized.countDocuments({ facultyId: { $in: facultyIds }, status: 'approved' }),
      Seminar.countDocuments({ facultyId: { $in: facultyIds } }),
    ]);

    res.json({
      stats: {
        totalFaculty,
        pendingFDPs,
        approvedFDPs,
        totalSeminars,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
