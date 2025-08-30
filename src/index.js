import dotenv from "dotenv"; //as soon as the env is loaded all the variables are available throughout the application

import connectDB from "./db/index.js"; //make a connectDb function somewhere else and import it here directly as
//  creaating a function here will require much logic and code in the same file which makes the code not
// readable and also creates a mess.

import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB Connection Error", err);
  });
