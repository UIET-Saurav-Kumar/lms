import express from "express";
import { activateUser, loginUser, logoutUser, registrationUser } from "../controllers/user.controller";
import { isAuthenticated } from "../middleware/auth";

const userRouter = express.Router();

// userRouter.post('/registration' , registrationUser)
userRouter.route('/registration').post(registrationUser)
userRouter.route('/activateUser').post(activateUser)
userRouter.route('/login').post(loginUser)
userRouter.route('/logout').get(isAuthenticated , logoutUser)

export default userRouter ;