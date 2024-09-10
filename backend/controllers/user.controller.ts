import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/errorHandler";
import userModal, { IUser } from "../models/userModal";
import jwt , { JwtPayload, Secret } from "jsonwebtoken";
require('dotenv').config()
import ejs from 'ejs'
import path from "path";
import sendEmail from "../utils/sendMail";
import { sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";

interface IRegistrationBody { 
    name : string;
    email : string;
    password : string;
    avatar? : string;
}


export const registrationUser = CatchAsyncError( async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {name , email , password} = req.body

        const isEmailExist = await userModal.findOne({email})
        if(isEmailExist){
          return next(new ErrorHandler("Email already Exist" , 400))
        }


        const user : IRegistrationBody = {
            name,
            email,
            password,
        }

        const activationToken = createActivationToken(user)

        const activationCode = activationToken.activationCode

        const data = {user : {name : user.name} , activationCode }
        
        // const html = await ejs.renderFile(path.join(__dirname , '../mails/activation-mail.ejs') , data)

       try {
        await sendEmail( {email : user.email , subject : 'Active Your Account' , template : '../mails/activation-mail.ejs' , data })

        res.status(201).json({
            success : true,
            message : `please check your email : ${user.email} for activate your account`,
            activationToken : activationToken.token
        })


       } catch (error : any) {
         return next(new ErrorHandler( error.message , 400 ))
       }
        

    } catch (error : any) {
        return next(new ErrorHandler(error.message , 400))
    }
})

interface IActivationToken{
    token : string,
    activationCode : string,
}


export const createActivationToken = (user  : any) : IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random()*9000).toString()

  const token = jwt.sign(
    {
     user , activationCode
    },
    process.env.ACTIVATION_SERECT as Secret ,
   {
    expiresIn : '5min'
   }
  

);

return {token  , activationCode}
}


interface IActivationRequest {
    activation_token : string,
    activation_code : string,
}

export const activateUser = CatchAsyncError( async (req : Request , res : Response , next : NextFunction) => {
    try {
        // const {activation_token , activation_code} : IActivationRequest = req.body  //here we are telling that req.body is type of IActivationRequest strictly 
        const {activation_token , activation_code}  = req.body as IActivationRequest //here we are assuming that req.body is type of IActivationRequest  
        
        const newUser : {user : IUser , activationCode : string} = jwt.verify(
            activation_token,
            process.env.ACTIVATION_SERECT as Secret ,
        ) as {user : IUser , activationCode : string}
        
        if(activation_code !== newUser.activationCode)
        {
            return next(new ErrorHandler('Activation Code is not correct', 400))
        }

        const {name , email , password } = newUser.user

        const isEmailExist = await userModal.findOne({email})

        if(isEmailExist){
            return next(new ErrorHandler("Email already Exist" , 400))
          }

          const user = await userModal.create({
            name,
            email,
            password
          })

        res.status(201).json({
            success : true,
        })


    }catch (error : any) {
        return next(new ErrorHandler(error.message , 400))
    }
} )

interface ILogoinRequest {
    email : string,
    password : string,
}


export const loginUser = CatchAsyncError( async (req : Request , res : Response , next : NextFunction) => {
    try {
        
        const {email , password}  = req.body as ILogoinRequest 

        if(!email || !password){
            return next(new ErrorHandler('Please enter email or password' , 400))
        }

        const user = await userModal.findOne({email}).select("+password")

        if(!user){
            return next(new ErrorHandler('Invalid email or password' , 400))
        }

        const isPasswordMatched = await user?.comparePassword(password)
        
        if(!isPasswordMatched){
            return next(new ErrorHandler('Invalid email or password' , 400))
        }
       

        sendToken(user, 200 , res);


    }catch (error : any) {
        return next(new ErrorHandler(error.message , 400))
    }
} )

export const logoutUser = CatchAsyncError( async (req : Request , res : Response , next : NextFunction) => {
    try {
        
        
        res.cookie("access_token" , '' , {maxAge : 1})
        res.cookie("refresh_token" , '' , {maxAge : 1})
        const userId = req.user?._id as string || '';
        redis.del(userId)
 
      res.status(200).json({
        success : true,
        message : "User lougout successfully"
      })

    }catch (error : any) {
        return next(new ErrorHandler(error.message , 400))
    }
} )

export const updateAccessToken = CatchAsyncError( async (req : Request , res : Response , next : NextFunction) => {
    try {
        
        const refreshToken = req.cookies.refresh_token as string;

        const decoded = jwt.verify(refreshToken , process.env.REFRESH_TOKEN as string)  as JwtPayload

        if(!decoded)
        {
            return next(new ErrorHandler( 'Could not Refresh token' , 400))
        }

        const session = await redis.get(decoded.id as string)

        if(!session){
            return next(new ErrorHandler( 'Could not Refresh token' , 400))
        }

        const user = JSON.parse(session)

        const accessToken = jwt.sign({id : user._id} , process.env.ACCESS_TOKEN as string , {expiresIn : '5m'})

        // const refreshToken = jwt.sign({id : user._id} , process.env.ACCESS_TOKEN as string , {expiresIn : '5m'})
       

    }catch (error : any) {
        return next(new ErrorHandler(error.message , 400))
    }
} )






