const Tour = require('./../models/tourModel');
const APIFeatures = require("../utils/APIFeatures");
const APPError = require('../utils/APPError');
const catchAsync = require('../utils/catchAsync');

exports.aliasTour = (req,res,next) => {
    req.query.limit = '5';
    req.query.sort = '-price,name';
    req.query.fields = 'name,price,duration';
    next();
};




exports.getAllTours =catchAsync(async(req,res,next) => {
    const features = new APIFeatures(Tour.find(),req.query)
    .filter()
    .sort()
    .limitingFields()
    .paginate();

    const tours = await features.query;
    res.status(200).json({
        status: `success`,
        results: tours.length,
        data:{
            tours
        }
    }) 
});

exports.createTour = catchAsync(async(req,res,next) => {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
        status: `success`,
        message: `tour create success`,
        tour: newTour
    });
});

exports.getTour = catchAsync(async (req,res,next) => {
        
            const tour = await Tour.findById(req.params.id);
            if(!tour){
                return next(new APPError(`can't find tour for that ID`,400))
            }
        res.status(200).json({
            status: `success`,
            data:{
                tour
            }
        })
        
});

exports.updateTour = catchAsync(async (req,res,next) => {
        const updatedTour = await Tour.findByIdAndUpdate(req.params.id,req.body,{
            new: true,
            runValidators: true
        });
        console.log(updatedTour)
        if(!updatedTour){
            return next(new APPError(`can't find tour for that ID`,400))
        }
        res.status(201).json({
            status: `success`,
            message: `tour updated success`,
            data: {
                tour: updatedTour
            }
        })
    
});

exports.deleteTour = catchAsync(async (req,res,next) => {
    
        const deletedTour = await Tour.findByIdAndDelete(req.params.id);
        
        if(!deletedTour){
            return next(new APPError(`can't find tour for that ID`,404))
        }

        res.status(200).json({
            status: `success`,
            message: `Tour deleted success`,
        })
    
});