const User = require("../models/userModel");
const APPError = require("../utils/APPError");
const APIFeatures = require("../utils/APIFeatures");
const catchAsync = require("../utils/catchAsync");

const filterObj = (obj,...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el =>{
        if(allowedFields.includes((el))) newObj[el] = obj[el] ;
    })
    return newObj;
}

exports.createUser = catchAsync(async(req,res)=>{
    const newUser = await User.create(req.body);
    res.status(201).json({
        status: 'success',
        message: `user created success`,
        data: {
            user: newUser,
        }
    })
});

exports.updateMe = catchAsync(async(req,res,next) => {
    //1) create error if user POSTs password data
    if(req.body.password || req.body.passwordConfirm){
        return next(new APPError('this rout is not allowed for password update',400));
    }
    //2) filter out unwanted field name, that are not allowed to be update
    const filteredBody = filterObj(req.body,'email','name')
    //3) update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id,filteredBody,{
        new: true,
        runValidators: true
    });
    res.status(200).json({
        status: 'success',
        message: 'updated success',
        data: {
            user: updatedUser
        }
    })
})

exports.getAllUsers = catchAsync(async(req,res,next)=>{
    const features = new APIFeatures(User.find(),req.query)
    .filter()
    .limitingFields()
    .sort()
    .paginate();
    const users = await features.query;
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users
        }
    })
});
exports.getUser = catchAsync(async(req,res,next)=>{
    const user = await User.findById(req.params.id);
    if(!user){
        return next(new APPError(`can't found user for that id`,400));
    }
    res.status(200).json({
        status: 'success',
        data:{
            user
        }
    })
});
exports.updateUser =catchAsync( async(req,res)=>{
    const updatedUser = await User.findByIdAndUpdate(req.params.id,req.body,{
        new: true,
        runValidators: true
    });
    if(!updatedUser){
        return next(new APPError(`can't found user for that id`,400));
    }
    res.status(200).json({
        status: 'success',
        message: `updated success`,
        data: {
            user: updatedUser
        }
    })
});

exports.deleteUser =catchAsync(async(req,res)=>{
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if(!deletedUser){
        return next(new APPError(`can't found user for that id`,400));
    }
    res.status(200).json({
        status: 'success',
        message: `deleted success`
    })
})