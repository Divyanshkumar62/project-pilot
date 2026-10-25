const mongoose = require('mongoose');

const connectDB = async (customUri) => {
    try {
        const uri = customUri || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/projectpilot";
        const connection = await mongoose.connect(uri);
        console.log(`✅ MongoDB connected: ${connection.connection.host}`);
        return connection;
    } catch (err) {
        console.error(`❌ MongoDB connection error: ${err.message}`);
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};

module.exports = connectDB;
