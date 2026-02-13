import app from "./app.js";
import dotenv from "dotenv";
import connectdb from "./config/db.js";
import createadmin from "./utils/createadmin.js";
dotenv.config();
connectdb().then(()=>{
  createadmin();
});
const PORT = 5000;
app.listen(PORT, () => {
  console.log("Server running");
});
