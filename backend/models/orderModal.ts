import mongoose, { Model, Schema } from "mongoose";

export interface IOrder {
    courseId : string;
    userId : string;
    payment_info : object;
}

const orderSchema = new Schema<IOrder>({
    courseId : {
        type : String,
        required  : true
    }, 
    userId : {
        type : String,
        required  : true
    }, 
    payment_info : {
        type : String,
        // required  : true
    },
} , {timestamps : true})

const orderModal : Model<IOrder> = mongoose.model('Order' , orderSchema)

export default orderModal;