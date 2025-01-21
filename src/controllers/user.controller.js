import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose"


const generateAccessAndRefreshTokens = async(userId) => {
      try {
        const user = await User.findById(userId)

        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({
            validateBeforeSave: false
        })

       return { accessToken, refreshToken }



      } catch (error) {
        throw new ApiError(500, "something went wrong while generating refresh and access tokens")
      }
}


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


const loginUser = asyncHandler( async (req, res) => {
        // req.body ---> data
        // email or username 
        // find the user
        // password 
        // access and refresh token
        // send cookies
        // res 

     const {email, username, password} =  req.body;
     console.log(req.body);
     
     if(!email && !username) {
        throw new ApiError(400, "username or email is required")
     }

     const user = await User.findOne({
        $or: [{username}, {email}]
     })

     if(!user) {
        throw new ApiError(404, "User does not exist")
     }
     
    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid) {
        throw new ApiError(401, "invalid user credentials")
     }


   const { accessToken, refreshToken }= await generateAccessAndRefreshTokens(user._id);

   const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken")
    
   const options = {
            httpOnly: true,
            secure: true
    }

    return res
    .status(200 )
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
             "User Logged In Succesfully"
        )
    )
});

const logoutUser = asyncHandler( async (req, res) => {
      User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { 
                refreshToken: undefined
            }
        },
        {
            new: true
        }
      )

      const options = {
        httpOnly: true,
        secure: true
      }

      return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(
        new ApiResponse(200, {}, "User LoggedOUt")
      )
      
})

// endPoint to refresh refreshToken
const refreshAccessToken = asyncHandler( async(req, res) => {
    const incommingRefeshToken =  req.cookies.refreshToken || req.body.refreshToken
    
    if(!incommingRefeshToken){
       throw new ApiError(401, "unauthorized Request")
    }

   try {
    const decodedToken = jwt.verify(
         incommingRefeshToken,
         process.env.REFRESH_TOKEN_SECRET
     )
 
     const user = await User.findById(decodedToken?._id)
 
     if(!user){
         throw new ApiError(401, "Invalid Refresh Token")
     }
 
     if(incommingRefeshToken !== user?.refreshToken){
         throw new ApiError(401, "Refresh Token is Expired & Used")
     }
 
     const options = {
         httpOnly: true,
         secure: true
     }
     const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
 
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
     new ApiResponse(
         200, 
         {
             accessToken,
             refreshToken: newRefreshToken
         },
         " AccessToken Refreshed "
     )
    )
   } catch (error) {
      throw new ApiError(401, error?.message || "invalid refresh Token")
   }
      
})

//  endPoint to change current password

const changeCurrentPassword = asyncHandler( async(req, res) => {
      // we can add confirmPassword on the requirement base
      const {oldPassword, newPassword} =  req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid Old Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse( 200, {}, "Password Changed SuccessFully")
    )

})

// get Current User endPoint

const getCurrentUser = asyncHandler( async(req, res) => {
    return res
    .status(200)
    .json(200, await req.user, "Current User fetched Successfully")
})

// updateAccountDetails endPoints
const updateAccountDetails = asyncHandler( async( req, res) => {
   const {fullName, email} = req.body

   if(!fullName || !email){
        throw new ApiError(401, "All field are required")
   }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
     $set: {
        fullName: fullName,
        email: email
     }
    },
    { new: true }
).select("-password")

return res
.status(200)
.json( new ApiResponse(200, user, "Account Detail Updated SuccessFully") )

})

const updatedUserAvatar = asyncHandler( async (req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) {
        throw new ApiError(400, "avatar file is missing")
    }

      const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

   const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
          $set: { avatar: avatar.url }
        },
        { new: true }

    ).select("-password")
    
    // todo to delete old image in Cloudinary

    return res
    .status(200)
    .json( new ApiResponse(200, user, "Avatar updated Successfully" ))
    
})


 const updatedUserCoverImage = asyncHandler( async(req, res) => {

        const coverImageLocalPath = req.file?.path

        if(!coverImageLocalPath) {
            throw new ApiError(400, "coverImage is missing ")
        }

       const coverImage = await uploadOnCloudinary(coverImageLocalPath)

       if(!coverImage.url) {
        throw new ApiError(400, "Error while uploading on coverImage")
      }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
           $set: {
            coverImage: coverImage.url
           }
        },
        { new: true }
    ).select("-password")

    return res
    .status(200)
    .json( new ApiResponse(200, user, "coverImage Updated SuccessFully"))
        
 })

 const getUserChannelProfile = asyncHandler( async( req, res)=> {

      const {username} = req.params

      if( !username?.trim()) {
        throw new ApiError(400, "username is missing")
      }

    //   User.find({username})
   const channel = await User.aggregate([
        {
            $match: {
              username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },

        {
            $lookup: {
                $from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },

        {
            $addFields: {

                subscribersCount: {
                    $size: "$subscribers"
                },
                 
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
              
                isSubscribed: {
                  $cond: {
                   if: { $in: [req.user?._id, "$subscribers.subscriber"]},
                   then: true,
                   else: false
                  }

                }  
                
            }
        },
        {
            $project: {

                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                
            }
        }

    ])

    if(!channel?.length) {
        throw new ApiError(400, "channel doest not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched Successfully" )
    )
 })

 const getWatchHistory = asyncHandler( async (req, res) => {
        const user = await User.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.user._id)
                }
            },

            {
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",

                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",

                                pipeline: [
                                    {
                                        $project: {
                                            fullName: 1,
                                            username: 1,
                                            avatar: 1,
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields: {
                                owner: {
                                  $first: "$owner"
                                }
                            }
                        }
                    ]
                }
            }


        ])

        if(!user) {
            throw new ApiError(400, "user is not define")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, user[0].getWatchHistory, " Watch History fetched SuccessFully " )
        )
 })

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updatedUserAvatar,
    updatedUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};
