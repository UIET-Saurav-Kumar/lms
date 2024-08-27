import mongoose from "mongoose";

require('dotenv').config()

const dataBaseURL = process.env.DB_URL || '';
 const connectDataBase = async () => {

    try {
      mongoose.connect(dataBaseURL).then((data : any) => {
        console.log('dataBase is conntec' , data.connection.host)
      })
    } catch (error : any) {
        console.log('Error in connecting DataBase' , error)
    }

}

export default connectDataBase;
