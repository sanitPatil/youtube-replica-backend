import mongoose from 'mongoose';
import { DB_NAME } from '../constant.js';
const connectDB = async () => {
	try {
		const connectionInstance = await mongoose.connect(
			`${process.env.MONGODB_URL}/${DB_NAME}`
		);
		console.log(
			`MongoDB successfully connected,with host:${connectionInstance.connection.host}`
		);
		return connectionInstance;
	} catch (error) {
		console.log(`DB connection Error:${error.message}`);
		process.exit(1);
	}
};
export { connectDB };

// mongoose.connection.on("connected", () => console.log("connected"));
// mongoose.connection.on("open", () => console.log("open"));
// mongoose.connection.on("disconnected", () => console.log("disconnected"));
// mongoose.connection.on("reconnected", () => console.log("reconnected"));
// mongoose.connection.on("disconnecting", () => console.log("disconnecting"));
// mongoose.connection.on("close", () => console.log("close"));
