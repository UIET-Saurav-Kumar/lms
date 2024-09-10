import { Request } from "express";
import { IUser } from "../models/userModal";


declare global {      //allows you to modify global types
    namespace Express{    //Namespaces in TypeScript allow for logical grouping of code.
        interface Request {
            user? : IUser
        }
    }
}