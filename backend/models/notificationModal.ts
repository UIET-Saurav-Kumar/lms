import mongoose, { Model, Schema } from "mongoose";

export interface INotifaction {
    title : string;
    message : string;
    status : string;
    userId : string;
}

const notificationSchema = new Schema<INotifaction>({
    title : {
        type : String,
        required : true,
    },
    message : {
        type : String,
        required : true,
    },
    status : {
        type : String,
        required : true,
        default : 'unread'
    },
    
},{timestamps : true})


const notificationModal : Model<INotifaction> = mongoose.model('Notification' , notificationSchema )

export default notificationModal;