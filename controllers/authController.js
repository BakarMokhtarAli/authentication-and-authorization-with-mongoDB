const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const APPError = require("../utils/APPError");
const jwt = require("jsonwebtoken");
const { promisify } = require('util');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

const signToken = (id,statusCode,res) => {
    const token = jwt.sign({id},process.env.SECRET_KEY,{expiresIn:'90d'});

    const cookieOptions = {
        expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        httpOnly: true
    }
    if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    res.cookie('jwt',token,cookieOptions);

    res.status(statusCode).json({
        status: 'success',
        token
    })
    return token;
}

exports.signup = catchAsync(async(req,res,next)=>{
    const newUser = await User.create(req.body);
    res.status(201).json({
        status: 'success',
        message: 'user created success',
        data:{
            user: newUser
        }
    })
});

exports.login = catchAsync(async(req,res,next) => {
    const { email,password } = req.body;
    //1) check if email and password exist
    if(!email || !password){
        return next(new APPError('please provide email and password',400));
    }
    //2) check if user exist and password is correct
    const existingUser = await User.findOne({email: email}).select("+password");
    // const checkPass = await existingUser.checkPassword(password,existingUser.password);
    
    if(!existingUser || !await existingUser.checkPassword(password,existingUser.password)){
        return next(new APPError(`Incorrect email or password`,401));
    }
    //3) if everythink is ok send token to client
    signToken(existingUser._id,200,res);
});

exports.protect = catchAsync(async(req,res,next) => {
    //1) getting token and check if it's there
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith(`Bearer`)){
        token = req.headers.authorization.split(" ")[1];
    }
    if(!token){
        return next(new APPError('you are not login, please login to get access',401));
    }
    //2) verification/verify the token
    const decoded = await promisify(jwt.verify)(token,process.env.SECRET_KEY);
    //3) check if user still exist
    const currentUser = await User.findById(decoded.id);
    if(!currentUser){
        return next(new APPError(`the user belonging this token does not exist`,401));
    }
    //4)check if user changed password after token was issued
    if(currentUser.changedPasswordAfter(decoded.iat)){
        return next(new APPError(`user recently changed password, please login again`,401));
    }
    req.user = currentUser;
    // GRANT ACCESS TO PROTECTED ROUTES
    next();
});


exports.restrictTo = (...roles) => {
    return (req,res,next) => {
        if(!roles.includes(req.user.role)){
            return next(new APPError(`you don't have permission to perform this action`,403));
        };
        next();
    }
};

exports.forgotPassword = catchAsync(async(req,res,next) => {
    //1) get user based on POSTED email
    const user = await User.findOne({email: req.body.email});
    if(!user){
        return next(new APPError('there is no user with that email',404));
    }
    //2) generate random token
    const resetToken = user.createResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/forgotPassword/${resetToken}`;
    const message = `forgot your password? submit to a PATCH request with your new password to: ${resetURL},
    if you did'nt forgot your password please ignore this email.`
    //3) send it to user's email
    try{
        await sendEmail({
            email: user.email, //req.body.email,
            subject: 'your password (VALID for 10mins)',
            message
        })
        res.status(200).json({
            status: 'success',
            message: 'token sent to email'
        })
    }catch(err){
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new APPError('there is an error for sending email, please try again later',500));
    }
    

});
exports.resetPassword = catchAsync(async(req,res,next) => {
    //1) get user based on reset token reset token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: {$gt: Date.now()}
    })
    //2) if reset token has not expired and there is not error set the new password
    if(!user){
        return next(new APPError('token is invalid or expired',400));
    };
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    //3) update passwordChangeAt property
    //4) log the user in, send JWT
    signToken(user._id,200,res);
});

exports.updatePassword = catchAsync(async(req,res,next) => {
    //1) get user from collection
    const user = await User.findById(req.user.id).select("+password");
    //2) check if POSTED current password is correct
    if(!await user.checkPassword(req.body.passwordCurrent,user.password)){
        return next(new APPError('your current passowrd is incorrect',401));
    }
    //3) if so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    //4) log user in , send JWT
    signToken(user._id,200,res);
   
})