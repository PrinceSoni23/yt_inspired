//step1: create a controller function for registering a user

import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponses.js";

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, username } = req.body;
  console.log("email:", email);

  // if (fullName === "") {
  //   throw new ApiError(400, "Full Name is required");
  // }             aise ek ek karke check karo OR

  // validate the user details (not empty, valid email, strong password etc.)

  if (
    [fullName, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //check if user already exists

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists with this email or username");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path; //[0] because its an array and we want the first element of the array as we have maxCount 1
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    //check if avatar is present or not
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    //if avatar upload failed
    throw new ApiError(500, "Error in uploading avatar");
  }

  //create user object - create entry in db
  const user = await User.create({
    fullName,
    avatar: avatar,
    coverImage: coverImage || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const CreatedUser = await User.findById(user._id).select(
    //check for user creation success
    //remove password and refresh token from the response

    "-password -refreshToken -createdAt -updatedAt"
  );

  if (!CreatedUser) {
    throw new ApiError(500, "User not created");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, CreatedUser, "User registered successfully"));
});

export { registerUser };

//Logic building for registering a user will be here

// Get user details from frontend
// validate the user details (not empty, valid email, strong password etc.)
// check if user already exists in the database
// hash the password (bcryptjs)
// upload the avatar to cloudinary
// create user object - create entry in db
// remove password and refresh token from the response
// check for user creation success
// send response to frontend
