require('dotenv').config()
import express, { NextFunction, Request, Response } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { ErrorMiddleware } from './middleware/errorMiddleware'
import userRouter from './routes/user_route'

export const app  = express()


// app.use() :- this is used to mount middleware in express application

// body perser
app.use(express.json({limit : '50mb'})) // this is for cloudaniry and it a built in middleware and its work is to conert parse json data
//comming form req and When a request with a Content-Type of application/json is received and based on body parser 
// limit reperesent that the incoming request bodies not be more than 50 mb in size

// //cookies perser
app.use(cookieParser())  // cookieParser is a miidleware when help in readind the cookies header from the incoming http request

// // cors => cross origin resource sharing
// app.use(cors({
//     origin : process.env.ORIGIN
// }))





app.use('/apk/V1/auth' , userRouter)

app.get('/home' , (req : Request , res : Response , next : NextFunction) => {
      res.status(200).json({
        data : 'this is my first route'
      })
})
app.all('*' , (req : Request , res : Response , next : NextFunction) => {
      res.status(200).json({
        data : `the given ${req.url} is not exist`
      })
})

app.use(ErrorMiddleware)