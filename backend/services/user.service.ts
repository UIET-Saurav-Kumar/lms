import { NextFunction, Response } from "express"
import userModal from "../models/userModal"
import ErrorHandler from "../utils/errorHandler"
import { redis } from "../utils/redis"

export const getUserById = async (id : string , res : Response , next : NextFunction) => {
    try {
        const userJSON = await redis.get(id)
    
        if(userJSON){
        const user = JSON.parse(userJSON)
       
        res.status(200).json({
        success : true,
        user
             })
}  
    } catch (error : any) {
        return next(new ErrorHandler(error.message , 400))
    }
    
}