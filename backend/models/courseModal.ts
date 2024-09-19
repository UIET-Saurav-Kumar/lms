import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser } from "./userModal";


interface IComment extends Document {
    user : IUser;
    comment :string;
    questionReplies: IComment[];
}

interface IReview extends Document {
   user: IUser;
   rating: number;
   comment: string;
   commentReplies? : IComment[];
}

interface ILink extends Document {
    title: string;
    url: string;
}

interface ICourseData extends Document {
    title: string;
    description: string;
    videoUrl: string;
    // videoThumbnail: object;
    videoSection: string;
    videoLength: number;
    videoPlayer: string;
    Links: ILink[];
    suggestions: string;
    questions: IComment[];
}

interface ICourse extends Document {
    name: string;
    description: string;
    price: number;
    estimatedPrice? : number;
    thumbnail : object;
    tags : string;
    level : string;
    demoUrl : string;
    benefits : {title : string}[];
    prerequisites : {title : string}[];
    reviews : IReview[];
    courseData : ICourseData[];
    rating? : number;
    purchased? : number;
}

const commentSchema = new Schema<IComment> ({
    user : Object,
    comment : String,
    questionReplies : [Object],
})

const reviewSchema = new Schema<IReview> ({
    user : Object,
    rating : {
        type : Number,
        default : 0,
    },
    comment : String,
    commentReplies : [Object],
})

const linkSchema = new Schema<ILink> ({
    title: String,
    url: String,
})

const courseDataSchema = new Schema<ICourseData> ({
    title : String,
    description : String,
    videoUrl : String,
    videoSection : String,
    videoLength : Number,
    videoPlayer : String,
    Links : [linkSchema],
    suggestions : String,
    questions : [commentSchema],
})

const courseSchema = new Schema<ICourse> ({
    name: {
        type : String,
        required : true,
    },
    description: {
        type : String,
        required : true,
    },
    price: {
        type : Number,
        required : true,
    },
    estimatedPrice :  {
        type : Number,
        required : true,
    },
    thumbnail : {
        public_id : {
            type : String,
        },
        url : {
            type : String,
        }
    },
    tags : {
        type : String,
        required : true,
    },
    level : {
        type : String,
        required : true,
    },
    demoUrl : {
        type : String,
        required : true,
    },
    benefits : [{title : String}],
    prerequisites : [{title : String}],
    reviews : [reviewSchema],
    courseData : [courseDataSchema],
    rating :  {
        type : Number,
        default : 0,
    },
    purchased :  {
        type : Number,
        default : 0,
    },
})


const courseModal : Model<ICourse>  = mongoose.model('Course' , courseSchema)


export default courseModal;