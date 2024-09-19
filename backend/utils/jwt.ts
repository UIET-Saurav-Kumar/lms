require('dotenv').config()
import { Response } from "express"
import { IUser } from "../models/userModal";
import { redis } from "./redis";


interface ITockenOption {
    expires : Date;
    maxAge : number;
    httpOnly : boolean;
    sameSite : "lax" | "strict" | "none" | undefined ;
    secure ? : boolean ;
}

const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '300' , 10)
const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '1200' , 10)

export const accessTokenOptions : ITockenOption = {
    expires : new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
    maxAge : accessTokenExpire * 1000 * 60 *60,
    httpOnly : true,    // Cookie is not accessible via JavaScript
    sameSite : "lax" 
}

export const refreshTokenOptions : ITockenOption = {
    expires: new Date(Date.now() +  refreshTokenExpire* 24 * 60 * 60 * 1000),  
    maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,   
    httpOnly : true,
    sameSite : "lax" 
}

export const sendToken = (user : IUser , statusCode : number , res : Response) => {

    const accessToken =  user.SignAccessToken()
    const responseToken = user.SignRefreshToken()
    
    //upload session to redis
    redis.set(user._id as string, JSON.stringify(user));


    //parse environment variable to integrates with fallback values


    // only set secure to true in production
    if(process.env.NODE_ENV === 'production'){
        accessTokenOptions.secure = true  // Cookie is sent only over HTTPS
    }

    res.cookie("access_token" , accessToken , accessTokenOptions)
    res.cookie("refresh_token" , responseToken , refreshTokenOptions)


    res.status(statusCode).json({
        success : true,
        user,
        accessToken
    })

}