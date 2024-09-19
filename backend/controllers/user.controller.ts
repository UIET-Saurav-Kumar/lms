import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/errorHandler";
import userModal, { IUser } from "../models/userModal";
import jwt , { JwtPayload, Secret } from "jsonwebtoken";
require('dotenv').config()
import ejs from 'ejs'
import path from "path";
import sendEmail from "../utils/sendMail";
import { accessTokenOptions, refreshTokenOptions, sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";
import { getUserById } from "../services/user.service"; 
import cloudinary from "cloudinary";


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
        
        const refresh_Token = req.cookies.refresh_token as string;

        const decoded = jwt.verify(refresh_Token , process.env.REFRESH_TOKEN as string)  as JwtPayload

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

        const refreshToken = jwt.sign({id : user._id} , process.env.REFRESH_TOKEN as string , {expiresIn : '3d'})
        
        req.user = user;

        res.cookie('access_token' , accessToken , accessTokenOptions)
        res.cookie('refresh_token' , refreshToken , refreshTokenOptions)

        res.status(200).json({
            success : true,
            accessToken
        })
       
    }catch (error : any) {
        return next(new ErrorHandler(error.message , 400))
    }
} )


export const getUserInfo = CatchAsyncError( async (req : Request , res : Response , next : NextFunction) => {
    try {
        const userId = req.user?._id as string
        getUserById(userId, res , next)
    } catch (error : any) {
        return next(new ErrorHandler(error.message , 400))
    }
   
})

//social auth

interface ISocial {
    name : string ,
    email : string,
    avatar : string,
}

export const socialAuth = CatchAsyncError( async (req : Request , res : Response , next : NextFunction) => {
    try {

        const {name , email , avatar} = req.body as ISocial
        const user = await userModal.findOne({email})

        if(!user){
            const newUser = await userModal.create({
                name , email , avatar
            })
            sendToken(newUser , 200 , res)
        }else{
            sendToken(user , 200 , res)
        }
        
    } catch (error : any) {
        return next(new ErrorHandler(error.message , 400))
    }
})


interface IUpdateUserInfo {
    name : string;
    email : string
}

export const updateUserInfo = CatchAsyncError( async (req : Request , res : Response , next : NextFunction) => {
    
    try {
        const {name , email} = req.body as IUpdateUserInfo

        const userId = req.user?._id

        const user =  await userModal.findById(userId)
        
        if(email && user){
            const isEmailExist = await userModal.findOne({email});
            if(isEmailExist){
                return next(new ErrorHandler("Email already Exist" , 400))
            }

            user.email  =email;
        }
        if(name && user){


            user.name  = name;
        }

        await user?.save()
        
        await redis.set(userId as string , JSON.stringify(user))

        res.status(200).json({
            success : true,
            user
        })

    } catch (error : any) {
        return next(new ErrorHandler(error.message , 400))
    }
})

interface IUpdatePassword {
    oldPassword : string;
    newPassword : string;
}

export const updateUserPassword = CatchAsyncError( async (req : Request , res : Response , next : NextFunction) => {
    
    try {
        const {oldPassword , newPassword} = req.body as IUpdatePassword

        if(!oldPassword ){
            return  next(new ErrorHandler('please enter old Password' , 400))
        }
        if(!newPassword){
            return  next(new ErrorHandler('please enter new Password' , 400))
        }
        
        const userId = req.user?._id

        const user =  await userModal.findById(userId).select("+password")


         
        if(user?.password === undefined){
            return next(new ErrorHandler('Ivalid User', 400))
        }

        const isValidPassword  = await user.comparePassword(oldPassword)
       
        if(!isValidPassword){
            return next(new ErrorHandler('Invalid old password', 400))
        }

        user.password = newPassword

        await user?.save()
        
        await redis.set(userId as string , JSON.stringify(user))

        res.status(200).json({
            success : true,
            user
        })

    } catch (error : any) {
        return next(new ErrorHandler(error.message , 400))
    }
})

export const updateUserAvatar = CatchAsyncError( async (req : Request , res : Response , next : NextFunction) => {
    
    try {
        const {avatar} = req.body

        
        const userId = req.user?._id
        
        const user =  await userModal.findById(userId)

        if(avatar && user){
            if(user?.avatar?.public_id){
                await cloudinary.v2.uploader.destroy(user?.avatar?.public_id)
            }
            
            const myCloud = await cloudinary.v2.uploader.upload(avatar , {
                folder : "avatars",
                width : 150,
            });
            
            user.avatar = {
                public_id : myCloud.public_id,
                url : myCloud.secure_url,
            }
        }

        await user?.save()
        
        await redis.set(userId as string , JSON.stringify(user))
        
        res.status(200).json({
            success : true,
            user
        })

    } catch (error : any) {
        console.log(error)
        return next(new ErrorHandler(error.message , 400))
    }
})