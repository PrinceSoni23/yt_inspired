//step1: create a controller function for registering a user

import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponses.js";
import jwt from "jsonwebtoken";

const generateAccessandRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

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

const loginUser = asyncHandler(async (req, res) => {
  // get email and password from req.body

  const { email, username, password } = req.body;

  if (!username || !email || !password) {
    throw new ApiError(400, "Username, email or password are required");
  }

  //find if user exists or not

  const user = User.findOne({
    $or: [{ username }, { email }],
  });

  //if user nhi hai
  if (!user) {
    throw new ApiError(404, "User does not exists");
  }

  //if user hai then check password

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid User Credentials");
  }

  //accesss and refresh token

  const { accessToken, refreshToken } = await generateAccessandRefreshToken(
    user._id
  );

  //optional thing to not send password and refresh token in cookies
  const loggedInUser = await User.findById(user._id);
  select("-password -refreshToken");

  //send information in cookies
  const options = {
    httpOnly: true, //aise koi frontend se modify nhi kar sakta cookies ko
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: {
      refreshToken: undefined,
    },
  });
  const options = {
    httpOnly: true, //aise koi frontend se modify nhi kar sakta cookies ko
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"));
});

// function to provide an endpoint to refresh access token with just one click and do not need to login again and again
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh Token is required");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    const user = user.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Refresh Token is required");
    }

    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    const options = {
      httpOnly: true, //aise koi frontend se modify nhi kar sakta cookies ko
      secure: true,
    };
    const { accessToken, newrefreshToken } =
      await generateAccessandRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            newrefreshToken,
          },
          "Access Token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, "Invalid Refresh Token");
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };

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

// ----------------------------------------------------------------------------------------------------------

// Logic flow for login user will be here
//1. get email and password from req.body
//2. validate the email and password (not empty, valid email etc.)
//3. check if user exists with the given email
//4. if user exists then compare the password with the hashed password in db (bcryptjs)
//5. if password matches then generate access token and refresh token (jwt)
//6. save the refresh token in db for that user
//7. send the access token and refresh token to frontend in httpOnly cookie
//8. send response to frontend with user details except password and refresh token
