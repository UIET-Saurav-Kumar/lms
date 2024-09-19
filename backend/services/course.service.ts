import { Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import courseModal from "../models/courseModal";



export const createCoure = CatchAsyncError(async ( data : any , res : Response ) => {
     
    const course = await courseModal.create(data);

    res.status(200).json({
        success : true,
        course,
    })
})