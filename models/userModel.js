const mongoose = require('mongoose');
const validator = require('validator')
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = mongoose.Schema({
    name:{
        type: String,
        required: [true,'user must have a name'],
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        validate: [validator.isEmail,'please provide a valid email']
    },
    photo: String,
    role: {
        type: String,
        default: 'user',
        enum:{
            values:['user','guide','lead-guide','admin'],
            message: 'role must be either user, guide, lead-guide or admin'
        }
    },
    password: {
        type: String,
        required: [true,'password is required'],
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true,'please confirm your password'],
        validate:{
            validator: function(pass){
                return pass === this.password
            },
            message: 'passwords are not the same'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
});

userSchema.pre("save",function(next){
    if(!this.isModified || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
})

userSchema.pre("save",async function(next){
    // only runs if password was modified
    if(!this.isModified("password")) return next();

    // hash the password
    this.password = await bcrypt.hash(this.password,12);

    // delete password confirm field
    this.passwordConfirm = undefined;

    next();
});

userSchema.methods.checkPassword = async function(candidatePass,userPass){
    // since we have password field selected as false "this.password" will not available
    //so we have passed user's password as a parameter
    return await bcrypt.compare(candidatePass,userPass);
};

userSchema.methods.changedPasswordAfter = function(JWTTimeStamp){

    if(this.passwordChangedAt){
        const changeTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000,10)
        return JWTTimeStamp < changeTimestamp;
    }

    // FALSE means password not changed!
    return false;
}

userSchema.methods.createResetPasswordToken =function(){
    const resteToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resteToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    console.log({resteToken},this.passwordResetToken);

    return resteToken;
}




const User = mongoose.model("User",userSchema);

module.exports = User;