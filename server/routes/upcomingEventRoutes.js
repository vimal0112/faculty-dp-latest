const express = require("express");
const router = express.Router();
const UpcomingEvent = require("../models/UpcomingEvent");

// CREATE EVENT
router.post("/", async (req, res) => {
  try {
    const event = new UpcomingEvent(req.body);
    const saved = await event.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET EVENTS BY FACULTY
router.get("/", async (req, res) => {
  try {
    const { facultyId } = req.query;
    if (!facultyId) {
      return res.status(400).json({ error: "facultyId required" });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Auto-delete events whose start date is before today
    await UpcomingEvent.deleteMany({
      facultyId,
      startDate: { $lt: startOfToday }
    });

    const events = await UpcomingEvent.find({ facultyId }).sort({ startDate: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE EVENT
router.put("/:id", async (req, res) => {
  try {
    const updated = await UpcomingEvent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MARK NOTIFICATION SENT
router.put("/:id/notification", async (req, res) => {
  try {
    const updated = await UpcomingEvent.findByIdAndUpdate(
      req.params.id,
      { notificationSent: true },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
