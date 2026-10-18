import mongoose from 'mongoose';

const DEFAULT_MONGODB_URI = 'mongodb+srv://bonnbon13052002_db_user:zI9Zj36gmDfMYmFP@cluster0.awzjbrb.mongodb.net/test?appName=Cluster0';

let cachedConnection = null;

export default async function connectDb() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

  try {
    cachedConnection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    });
    console.log('MongoDB connected successfully');
    return cachedConnection;
  } catch (err) {
    cachedConnection = null;
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
}
