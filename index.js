import "dotenv/config";
import app from "./src/app.js";
const PORT = process.env.PORT;

const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`listening on PORT ${PORT}`);
  });
};

startServer();
