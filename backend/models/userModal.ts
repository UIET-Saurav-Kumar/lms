import mongoose ,  {Document , Model , Schema} from "mongoose";  //Schema is for typeScript


const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser  extends Document{ //Doucument is a built in interface that represent a single document in a  mongoDB collection
                                          //it include several properties and methods
 
 name : string;
 email : string;
 password : string;
 avatar : {
    public_id : string;
    url : string;
 };
 role : string;
 isVerified  : boolean;
 courses : Array<{courseId : string}>;
 comparePassword : (password : string) => Promise<boolean>;
}


const userSchema : Schema<IUser> = new mongoose.Schema({
   name : {
    type : String,
    required : [true , 'Please provide your name']
   }
})


