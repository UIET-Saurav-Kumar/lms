require('dotenv').config()
import express, { NextFunction, Request, Response } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

export const app  = express()

// body perser
app.use(express.json({limit : '50mb'})) // this is for cloudaniry and it a built in middleware and its work is to conert parse json data
//comming form req and When a request with a Content-Type of application/json is received and based on body parser 

// //cookies perser
// app.use(cookieParser())

// // cors => cross origin resource sharing
// app.use(cors({
//     origin : process.env.ORIGIN
// }))





// app.use()

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

