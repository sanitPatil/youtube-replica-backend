import "dotenv/config";
import app from "./src/app.js";
const PORT = process.env.PORT;

const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`listening on PORT ${PORT}`);
  });
  app.on("error", () => {
    console.log("failed to start server");
  });
};

startServer();

console.log("server started");
