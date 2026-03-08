const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testAdmin() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected");
    const admin = await User.findOne({ email: 'admin@tce.edu' });
    console.log("Admin:", admin ? admin._id : 'Not found');

    if (admin) {
        const res = await fetch('http://localhost:3001/api/audit/stats', {
            headers: {
                'user-id': admin._id.toString()
            }
        });
        const data = await res.json();
        require('fs').writeFileSync('admin-stats.json', JSON.stringify(data, null, 2));

        const res2 = await fetch('http://localhost:3001/api/audit/data', {
            headers: {
                'user-id': admin._id.toString()
            }
        });
        const data2 = await res2.json();
        require('fs').writeFileSync('admin-data.json', JSON.stringify({ keys: Object.keys(data2), error: data2.error || null }, null, 2));
    }
    process.exit();
}

testAdmin().catch(console.error);
