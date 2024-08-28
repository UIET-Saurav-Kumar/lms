import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandler";

export const ErrorMiddleware = (error : any , req : Request , res : Response , next : NextFunction) => {
        error.statusCode = error.statusCode || 500;
        error.message = error.message || 'Internal Server Error form errorMiddleWare';

        
}