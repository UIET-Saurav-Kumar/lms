import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandler";

export const ErrorMiddleware = (error : any , req : Request , res : Response , next : NextFunction) => {
        error.statusCode = error.statusCode || 500;
        error.message = error.message || 'Internal Server Error form errorMiddleWare';

        //wrong mongodb id error
        if(error.name === 'CastError'){
                const message = `Resorce not found. Invalid: ${error.path}`;
                error = new ErrorHandler(message , 400)
        }
        
        //Dublicate Key Error
        if(error.code === 11000){
                const message = `Dublicate ${Object.keys(error.keyValue)} entered`;
                error = new ErrorHandler(message , 400)
        }

        //wrong jwt error
        if(error.name === 'JsonWebTokenError'){
                const message = `Json Web token is invalid, try again`;
                error = new ErrorHandler(message , 400)
        } 
        
        //JWT expired error
        if(error.name === 'TokenExpiredError'){
                const message = `Json Web token is experied, try again`;
                error = new ErrorHandler(message , 400)
        }

        res.status(error.statusCode).json({success : false ,  message : error.message})
}