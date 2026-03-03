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

// DELETE EVENT
router.delete("/:id", async (req, res) => {
  try {
    await UpcomingEvent.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;