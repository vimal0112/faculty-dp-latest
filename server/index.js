require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

/* =========================
   Middleware
========================= */
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* =========================
   MongoDB Connection
========================= */
const MONGODB_URI = process.env.MONGODB_URI;

async function connectMongoDB() {
  try {
    if (!MONGODB_URI) {
      console.error("❌ MONGODB_URI not found in .env file");
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB Atlas successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

connectMongoDB();

/* =========================
   Routes
========================= */
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const facultyRoutes = require('./routes/faculty');
app.use('/api/faculty', facultyRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const hodRoutes = require('./routes/hod');
app.use('/api/hod', hodRoutes);

const eventRoutes = require('./routes/events');
app.use('/api/events', eventRoutes);

const auditRoutes = require('./routes/audit');
app.use('/api/audit', auditRoutes);

const upcomingEventRoutes = require('./routes/upcomingEventRoutes');
app.use('/api/upcoming-events', upcomingEventRoutes);

/* =========================
   Health Check
========================= */
app.get('/', (req, res) => {
  res.send("Backend Server is Running 🚀");
});

/* =========================
   Start Server
========================= */
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});