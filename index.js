import 'dotenv/config';
import app from './src/app.js';
import { connectDB } from './src/db/dbConnect.db.js';
import cluster from 'node:cluster';
import os from 'node:os';
const PORT = process.env.PORT;
const cpuNums = os.availableParallelism();

const startServer = async () => {
	await connectDB();
	try {
		if (cluster.isPrimary) {
			console.log(process.pid, 'primary');
			for (let i = 0; i < cpuNums; i++) {
				cluster.fork();
			}
		} else {
			app.listen(PORT, () => {
				console.log(`listening on PORT http://localhost:${PORT}`);
			});
			app.on('error', () => {
				console.log('failed to start server');
			});
		}
	} catch (error) {
		console.log(`clutering error`, error);
	}
};

startServer();
