const APPError = require("../utils/APPError");

const sendErrDev = (err,res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    })
};

const sendErrorProd = (err,res) => {
    if(err.isOpertional){
       res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        })
    }else{
        console.error("error: ",err);
        res.status(500).json({
            status: 'error',
            message: `something went very wrong`
        })
    }
}

// handle invalid databse ids
const handleCastErrorDb = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new APPError(message,400);
}
 
// handle validation errors such as missing required field
const  hadnleValidationError = err => {
    const errors = Object.values(err.errors).map(el => el.message);

    const message = `Invalid input data ${errors.join(". ")}`
    return new APPError(message, 400);
}

// handle duplicate field in the databse
const handleDuplicateFieldDb = err => {
    const value = err.message.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
    const message = `duplicate field ${value} please use an other value!`;
    return new APPError(message,400);
}

const handleJWTError = () => new APPError('invalid token',401);
const handleTokenExpired = () => new APPError(`token expired, please login again!`,401);


module.exports = ((err,req,res,next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if(process.env.NODE_ENV === 'production'){
        // invalid database ids
        if(err.name === "CastError") err = handleCastErrorDb(err);
        // validation errors
        if(err.name === "ValidationError") err = hadnleValidationError(err);
        // duplicate field
        if(err.code === 11000) err = handleDuplicateFieldDb(err)

        if(err.name === 'JsonWebTokenError') err = handleJWTError();
        if(err.name === 'TokenExpiredError') err = handleTokenExpired();
        sendErrorProd(err,res)
    }else{
        sendErrDev(err,res);
    }
})