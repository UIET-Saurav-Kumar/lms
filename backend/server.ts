import { app } from "./app";
import connectDataBase from "./utils/db";
import { redis } from "./utils/redis";
require('dotenv').config()

app.listen(process.env.PORT , () => {
   console.log(`server is connected to port ${process.env.PORT}`)
   connectDataBase()
   
})