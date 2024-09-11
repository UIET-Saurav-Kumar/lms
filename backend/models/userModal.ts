require('dotenv').config()
import mongoose ,  {Document , Model , Schema} from "mongoose";  //Schema is for typeScript
import bcrypt from 'bcryptjs'
import jwt  from "jsonwebtoken";

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser  extends Document{ //Doucument is a built in interface that represent a single document in a  mongoDB collection it include several properties and methods
//  _id : string;
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
 SignAccessToken : () => string;
 SignRefreshToken : () => string;
}


const userSchema : Schema<IUser> = new mongoose.Schema({
   name : {
    type : String,
    required : [true , 'Please provide your name']
   },
   email : {
    type : String,
    required : [true , 'Please provide your email'],
    validate : {
        validator : function (value : string) {
            return emailRegexPattern.test(value)
        }
    }
   },
   password : {
    type : String,
    minlength : [6 , 'password must be at least 6 character'],
    select : false,   // it exclude the password from the result when we query document from database
   },
   avatar : {
      public_id : String,
      url : String,
   },
   role : {
    type : String,
    default : 'user'
   },
   isVerified : {
    type : Boolean,
    default : false
   },
   courses : [
    {courseId : String}
   ]



} , {timestamps : true})  //timestamps set created at and updated at

//Hash the password before saving and it is doing with help of (pre)

userSchema.pre<IUser>('save' , async function (next) {   //pre is middleware which run berofe some event here it is before the document is saved
    //check password is changed or not
    if(!this.isModified('password'))  //if password is not changed then skip the process
    {
      return next()
    }

    this.password = await bcrypt.hash(this.password , 10)
    next();
})


userSchema.methods.SignAccessToken =  function ()  {
   return jwt.sign({id : this._id} , process.env.ACCESS_TOKEN || '' , {expiresIn : '5m'})
}

userSchema.methods.SignRefreshToken =  function ()  {
   return jwt.sign({id : this._id} , process.env.REFRESH_TOKEN || '' , {expiresIn : '7d'})
}

//compare password
//methods is a object where you can define your custom function and these functions are available for the document created by this schema
userSchema.methods.comparePassword = async function (enteredPassword : string) : Promise<Boolean> {  
      return await bcrypt.compare(enteredPassword , this.password)
}




const userModal : Model<IUser> = mongoose.model("User" , userSchema)

export default userModal