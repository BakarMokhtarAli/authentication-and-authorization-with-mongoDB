const express = require('express');
const conn = require('./connection/db');
const tourRouter = require('./routes/tourRouter');
const userRouter = require('./routes/userRouter');
const APPError = require('./utils/APPError');
const globalErrorHandleMiddleware = require('./controllers/errorController');


const app = express();

app.use(express.json());

app.use("/api/v1/tours",tourRouter);
app.use("/api/v1/users",userRouter);

// this must be under the right routes
app.use("*",(req,res,next) => {
   const message = `Can't find this ${req.originalUrl} url on this server!`;
   next(new APPError(message,404))
})
app.use(globalErrorHandleMiddleware);

module.exports = app;