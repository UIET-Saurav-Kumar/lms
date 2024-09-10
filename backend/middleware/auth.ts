require('dotenv').config()
import jwt , {JwtPayload} from "jsonwebtoken";
import { CatchAsyncError } from "./catchAsyncErrors";
import { NextFunction, Request } from "express";
import ErrorHandler from "../utils/errorHandler";
import { redis } from "../utils/redis";



export const isAuthenticated = CatchAsyncError( async (req : Request , res : Response , next : NextFunction) => {
  
    const access_token = req.cookies.access_token as string
    if(!access_token){
        return next(new ErrorHandler('Please login to access to this resource' , 400))
    }

    const decode = jwt.verify(access_token , process.env.ACCESS_TOKEN as string) as JwtPayload

    if(!decode){
        return next(new ErrorHandler('access token is not valid' , 400))
    }

    const user = await redis.get(decode.id)

    if(!user){
        return next(new ErrorHandler('user not found' , 400))
    }

    req.user = JSON.parse(user);

    next();
})

export const authorizeRoles = (...roles : string[]) => {
    return CatchAsyncError(async (req : Request , res : Response , next : NextFunction) => {
       
        
        if(!roles.includes(req.user?.role || '')){
            return next(new ErrorHandler(`Role ${req.user?.role} is not allowed to access this resource` , 403))
        }

        next()

    })
}