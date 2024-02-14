import bcrypt from "bcrypt";// this is used to hash the pass and also compare it to the ones provided by the user
import jwt from "jsonwebtoken";// this lib creates jwt token we have to pass some variables

// *** object model ***

import mongoose, {Schema} from "mongoose";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true // helps in searching optimizes code
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String, // cloudinary url
        required: true,
    },
    coverImage: {
        type: String, // cloudinary url
        required: true
    },
    watchHistory:[
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true , "Password is required "]
    },
    refreshToken:{
        type: String
    }
}, {timestamps : true})

// ***** hooks middlewares and bcrypt *****

userSchema.pre("save", async function(next) { // pre is a middleware fun and save is a document function
    // here we use functions in place of callback as it does not have the access to this.password

    if(!this.isModified("password")) return next();
    
    this.password = await bcrypt.hash(this.password , 10)
    next()
})

// to check pass provided by user is matching with hashed password ***
// we make our custom hooks(save, validate, etc) ***
// if isPasswordCorrect(document function which is called by this.constructor) is not there it will be created by mongoose ***
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
    // returns value in boolean here password is the one which is given by user
}

// **** jwt *****

userSchema.methods.generateAccessTokens = function(){
    jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshTokens = function(){
    jwt.sign(
        {
            _id: this._id, // as it keeps on refreshing hence we only keep id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model("User", userSchema)