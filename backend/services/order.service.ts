import { NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import orderModal from "../models/orderModal";

const createOrder = CatchAsyncError(async(data : any , next : NextFunction)=>{
    const order = await orderModal.create(data);
    next(order);
})