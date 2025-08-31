//middleware for checking the logged in user and then logging it out

import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

// Middleware to verify JWT
export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    // Check if token is provided for already logged in user
    if (!token) {
      throw new ApiError(401, "Unauthorized Access");
    }

    // Verify the token by decoding it
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find the user associated with the token
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    // Check if user exists
    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user; // Attach user to request object
    next(); // Proceed to the next middleware
  } catch (error) {
    next(new ApiError(401, error.message || "Unauthorized Access"));
  }
});
