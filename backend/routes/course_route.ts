import express from "express";
import { addQuestion, addQuestioneply, addReplyToReview, addReview, editCourse, getAllCourse, getSingleCourse, getSingleCoursePaid, uploadCourse } from "../controllers/course.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";

const courseRoute = express.Router()

courseRoute.route('/createCourse').post(isAuthenticated , authorizeRoles('admin') ,  uploadCourse)
courseRoute.route('/editCourse/:id').put(isAuthenticated , authorizeRoles('admin') ,  editCourse)
courseRoute.route('/getSingleCourse/:id').get( getSingleCourse)
courseRoute.route('/getAllCourses').get( getAllCourse)
courseRoute.route('/getSingleCoursePaid/:id').get( isAuthenticated ,  getSingleCoursePaid)
courseRoute.route('/addQuestion').put( isAuthenticated ,  addQuestion)
courseRoute.route('/addQuestionReply').put( isAuthenticated ,  addQuestioneply)
courseRoute.route('/addReview/:id').put( isAuthenticated ,  addReview)
courseRoute.route('/addReviewReply').put( isAuthenticated , authorizeRoles('admin') ,  addReplyToReview)


export default courseRoute;