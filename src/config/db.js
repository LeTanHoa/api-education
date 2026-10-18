import mongoose from'mongoose';

export default async function connectDb(){
  const uri=process.env.MONGODB_URI;
  if(!uri)throw new Error('MONGODB_URI is not set. Create server/.env from server/.env.example and provide a MongoDB connection string.');
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}
