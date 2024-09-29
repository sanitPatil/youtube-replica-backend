import "dotenv/config";
import app from "./src/app.js";
import { connectDB } from "./src/db/dbConnect.db.js";
const PORT = process.env.PORT;

const startServer = async () => {
  connectDB();
  app.listen(PORT, () => {
    console.log(`listening on PORT ${PORT}`);
  });
  app.on("error", () => {
    console.log("failed to start server");
  });
};

startServer();
