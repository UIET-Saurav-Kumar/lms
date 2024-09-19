import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/errorHandler";
import cloudinary from "cloudinary";
import { createCoure } from "../services/course.service";
import courseModal from "../models/courseModal";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import sendEmail from "../utils/sendMail";




export const uploadCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
   try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      if (thumbnail) {
         const uplodadedData = await cloudinary.v2.uploader.upload(thumbnail, {
            folder: 'courses'
         })


         data.thumbnail = {
            public_id: uplodadedData.public_id,
            url: uplodadedData.secure_url,
         }

      }

      createCoure(data, res, next)

   } catch (error: any) {
      return next(new ErrorHandler(error.message, 400))
   }
})

export const editCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
   try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      if (thumbnail) {
         await cloudinary.v2.uploader.destroy(thumbnail.public_id);

         const uplodadedData = await cloudinary.v2.uploader.upload(thumbnail, {
            folder: 'courses'
         })


         data.thumbnail = {
            public_id: uplodadedData.public_id,
            url: uplodadedData.secure_url,
         }

      }

      const courseId = req.params.id;

      const courseData = await courseModal.findByIdAndUpdate(
         courseId,
         {
            $set: data,  //it only update the sepecific data which comes in the data
         },
         { new: true }   //if it not use then return value is data before update 
      );

      res.status(201).json({
         success: true,
         course: courseData
      });

   } catch (error: any) {
      return next(new ErrorHandler(error.message, 400))
   }
})

// get single course without purchasing
export const getSingleCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
   try {

      const courseId = req.params.id;

      const isDataCashed = await redis.get(courseId)

      if (isDataCashed) {

         const course = JSON.parse(isDataCashed)

         res.status(200).json({
            success: true,
            course,
         })
      } else {

         const course = await courseModal.findById(req.params.id).select("-courseData.videoUrl -courseData.suggestion -courseData.question -courseData.links");
         await redis.set(courseId, JSON.stringify(course))
         res.status(200).json({
            success: true,
            course,
         })
      }
   } catch (error: any) {
      return next(new ErrorHandler(error.message, 400))
   }
})

//get All courses -- without purchase

export const getAllCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
   try {


      const isDataCashed = await redis.get('allCourses')

      if (isDataCashed) {

         const course = JSON.parse(isDataCashed)

         res.status(200).json({
            success: true,
            course,
         })
      } else {

         const course = await courseModal.find().select("-courseData.videoUrl -courseData.suggestion -courseData.question -courseData.links");
         await redis.set('allCourses', JSON.stringify(course))
         res.status(200).json({
            success: true,
            course,
         })
      }
   } catch (error: any) {
      return next(new ErrorHandler(error.message, 400))
   }
})

export const getSingleCoursePaid = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
   try {

      const courseId = req.params.id;

      const courseData = req.user?.courses

      const isCoursePresent = courseData?.find((course: any) => course._id.toString() === courseId)

      if (!isCoursePresent) {
         return next(new ErrorHandler('you are not eligible to access this course', 400))
      }

      const course = await courseModal.findById(courseId)

      const content = course?.courseData

      res.status(200).json({
         success: true,
         content,
      })

   } catch (error: any) {
      return next(new ErrorHandler(error.message, 400))
   }
})

interface IAddQuestion {
   question: string,
   courseId: string,
   contentId: string,
}

export const addQuestion = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
   try {

      const { question, courseId, contentId }: IAddQuestion = req.body;

      const course = await courseModal.findById(courseId);

      if (!course) {
         return next(new ErrorHandler('Invalid course Id', 400))
      }

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
         return next(new ErrorHandler('Invalid content Id', 400))
      }

      const courseContent = course?.courseData?.find((item: any) => item?._id.equals(contentId))

      if (!courseContent) {
         return next(new ErrorHandler('Invalid content Id', 400))
      }
      //create a new question object
      const questionData: any = {
         user: req.user,
         question,
         questionReplies: []
      }

     // Add this question to our course
      courseContent.questions.push(questionData)

      await course.save();


      res.status(200).json({
         success: true,
         course,
      })

   } catch (error: any) {
      return next(new ErrorHandler(error.message, 400))
   }
})

interface IAddReply {
   answer: string,
   courseId: string,
   contentId: string,
   questionId: string,
}

export const addQuestioneply = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
   try {

      const { answer, courseId, contentId  , questionId}: IAddReply = req.body;

      const course = await courseModal.findById(courseId);

      if (!course) {
         return next(new ErrorHandler('Invalid course Id', 400))
      }

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
         return next(new ErrorHandler('Invalid content Id', 400))
      }

      const courseContent = course?.courseData?.find((item: any) => item?._id.equals(contentId))

      if (!courseContent) {
         return next(new ErrorHandler('Invalid content Id', 400))
      }

      const question = courseContent?.questions?.find((item: any) => item?._id.equals(questionId))

      if (!question) {
         return next(new ErrorHandler('Invalid question Id', 400))
      }
      //create a new answer object

      const answerData: any = {
         user: req.user,
         answer,
      };

     // Add this answer to our course
      question.questionReplies.push(answerData)

      await course.save();

      if(req.user?._id === question.user._id){
         //notificatin 
      }else{
         const data = {
            name : question.user.name,
            title : courseContent.title
         }
        try {
         await sendEmail({email : question.user.email, subject : "Question reply", template : "../mails/question-reply.ejs", data})
        } catch (error : any) {
         return next(new ErrorHandler(error.message, 400))
        }
         
      }


      res.status(200).json({
         success: true,
         course,
      })

   } catch (error: any) {
      return next(new ErrorHandler(error.message, 400))
   }
})


interface IAddReviewData {
   review : string,
   rating : number,
   userId : string,
}


export const addReview = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
   try {

      const courseId = req.params.id;

      const course = await courseModal.findById(courseId)

      if(!course){
         return next(new ErrorHandler("course id is not valid" , 400))
      }


      const courseList = req.user?.courses;

      const isCoursePresent = courseList?.some((item : any) => item._id.toString() === courseId.toString())
      
      if(!isCoursePresent) {
         return next(new ErrorHandler("you are not eligible to access this course" , 400))
      }

      const {review , rating} : IAddReviewData = req.body
      
      const reviewData : any = {
         user : req.user,
         rating ,
         comment : review
      }

      course.reviews.push(reviewData);

      let avg : number = 0

      course?.reviews.forEach((rev : any) => {
         avg += rev.rating;
      })

      course.rating = avg / course.reviews.length;

      await course?.save();


      const notification = {
         title : "New Review Received",
         message : `${req.user?.name} has given a review in ${course?.name}`
      }

      


      res.status(200).json({
         success: true,
         course,
      })

   } catch (error: any) {
      return next(new ErrorHandler(error.message, 400))
   }
})

interface  IReplyToReviewData {
   comment : string,
   courseId : string,
   reviewId : string
}

export const addReplyToReview = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
   try {

      const {comment , courseId , reviewId} : IReplyToReviewData = req.body

 

      const course = await courseModal.findById(courseId)

      if(!course){
         return next(new ErrorHandler("course id is not valid" , 400))
      }

      const review = course.reviews?.find((item : any) => item?._id.toString() === reviewId)

      if(!review){
         return next(new ErrorHandler("review id is not valid" , 400))
      }

      const replyData : any = {
         user : req.user,
         comment
      }

      review.commentReplies?.push(replyData)

      await course?.save();


      res.status(200).json({
         success: true,
         course,
      })

   } catch (error: any) {
      return next(new ErrorHandler(error.message, 500))
   }
})