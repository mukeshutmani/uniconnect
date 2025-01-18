import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler(async (req, res) => {
  // get userdetail from frontend
  // validation - not empty
  // check if user already exit note: Check email and username
  // check files avatar
  // upload them to cloudianry
  // crate user object - create entry in db
  // remove password and refresh token feed from res
  // check for user creation
  // return res../
  //

  const { fullName, email, username, password } = req.body;
//   console.log("email:", email);
  //       console.log("password:", password);
//   console.log("req Body", req.body);
  

  // if(fullName === ""){
  //        throw new ApiError(400, "full name is required")
  // }

    if (
       [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
    throw new ApiError(400, "All Fields are required");
        }

    const existedUser = await User.findOne({
       $or: [{ username }, { email }]
    })

   if(existedUser){
       throw new ApiError(409, "User with email or username already exists")
   }

//    console.log("req Files", req.files);
   
   // multer give file access
   const avatarLocalPath = req.files?.avatar[0]?.path
   // chaining ? 
   const coverImageLocalPath = req.files?.coverImage?.[0]?.path || "";
    // let coverImageLocalPath;
    // if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    //     coverImageLocalPath = req.files.coverImage[0].path
    // }
 

   if(!avatarLocalPath) { 
       throw new ApiError(400, "Avatar file is required") 
   }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
//   console.log(avatar);
  
  if(!avatar){
        throw new ApiError(400, "Avatar file is required")
  }

  const user = await User.create({
       fullName,
       avatar: avatar.url,
       coverImage: coverImage?.url || "",
       email,
       password,
       username: username.toLowerCase(),
  })

   const createUser = await User.findById(user._id).select(
       "-password -refreshToken"
   )
   if(!createUser) {
       throw new ApiError(500, "something went wrong while registering the user")
   } 

   return res.status(201).json(
       new ApiResponse(200, createUser, "User Registered Successfully")
   )
   
   
});

export { registerUser };
