import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${process.env.DATABASE_NAME}`
    );
    console.log(
      `MongoDB successfully connected,with host:${connectionInstance.connection.host}`
    );
    return connectionInstance;
  } catch (error) {
    console.log(`DB connection Error:${error.message}`);
  }
};
export { connectDB };
