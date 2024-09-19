import express from "express";
import { activateUser, getUserInfo, loginUser, logoutUser, registrationUser, socialAuth, updateAccessToken, updateUserAvatar, updateUserInfo, updateUserPassword } from "../controllers/user.controller";
import { isAuthenticated } from "../middleware/auth";

const userRouter = express.Router();

// userRouter.post('/registration' , registrationUser)
userRouter.route('/registration').post(registrationUser)
userRouter.route('/activateUser').post(activateUser)
userRouter.route('/login').post(loginUser)
userRouter.route('/logout').get(isAuthenticated , logoutUser)
userRouter.route('/refresh').get(updateAccessToken)
userRouter.route('/me').get(isAuthenticated , getUserInfo)
userRouter.route('/social-auth').post( socialAuth)
userRouter.route('/update-user-info').put(isAuthenticated ,  updateUserInfo)
userRouter.route('/update-user-password').put(isAuthenticated ,  updateUserPassword)
userRouter.route('/update-user-avatar').put(isAuthenticated ,  updateUserAvatar)

export default userRouter ;