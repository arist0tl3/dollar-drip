import mongoose from 'mongoose';

export async function connectDB(uri) {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri, {
    maxPoolSize: 5,
  });
}

export function disconnectDB() {
  return mongoose.disconnect();
}
