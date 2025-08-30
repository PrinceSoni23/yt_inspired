import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" })); //for accepting json data
app.use(express.urlencoded({ extended: true, limit: "16kb" })); //for accepting data from url
app.use(express.static("public")); //for storing file and folder in folder named public

app.use(cookieParser()); //for performing crud operations on the cookies of the user browser by the server

// step 3: import the user routes here

//User Routes
import userRouter from "./routes/user.routes.js";

//Routes Decleration
app.use("/api/v1/users", userRouter);

export { app };
