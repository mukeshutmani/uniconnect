import {Router} from "express";

import { 
  changeCurrentPassword, 
  getCurrentUser, 
  getUserChannelProfile, 
  getWatchHistory, 
  loginUser, 
  logoutUser, 
  refreshAccessToken, 
  registerUser, 
  updateAccountDetails, 
  updatedUserAvatar, 
  updatedUserCoverImage  } from "../controllers/user.controller.js";

import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
          name:"avatar",
          maxCount: 1,
        },
        {
          name: "coverImage",
          maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

router.route("/logout").post( verifyJWT,  logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT, changeCurrentPassword )

router.route("/current-user").get(verifyJWT, getCurrentUser)

//use patch to update only specific fields
router.route("/update-account-details").patch(verifyJWT, updateAccountDetails)
// secure routes

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updatedUserAvatar)

router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updatedUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile);

router.route("/history").get(verifyJWT, getWatchHistory )



export default router

