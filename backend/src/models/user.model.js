import mongoose, {Schema} from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        
    },
    
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true,
    },
    avatar:{
        type:String,
        required:true,

    },
    
    
    avatarPublicId:{
        type:String,
        default:"",
    },
    coverImage:{
        type:String,
    },
    coverImagePublicId:{
        type:String,
        default:"",
    },
    watchHistory:[
        {
            type: Schema.Types.ObjectId,
            ref:"Video"
        }

    ],
    savedVideos:[
        {
            type: Schema.Types.ObjectId,
            ref:"Video"
        }

    ],
    password:{
        type:String,
        required:[true,"Password is required"],

    },
    refreshToken:{
        type:String,
    },
    isEmailVerified:{
        type:Boolean,
        default:false,
    },
    emailVerificationToken:{
        type:String,
        default:"",
    },
    emailVerificationTokenExpiry:{
        type:Date,
        default:null,
    },
    // Failed verification attempts against the CURRENT code. Reset whenever a
    // new OTP is issued (register / resend) or on successful verification.
    // Stored on the user doc so the lockout survives restarts and works
    // across IPs; its lifetime is TTL-bound to the OTP itself.
    emailVerificationAttempts:{
        type:Number,
        default:0,
    },
    // Resend throttling for the pre-login resend endpoint: max resends per
    // email within a rolling window (see RESEND_MAX_COUNT in user.controller).
    verificationResendCount:{
        type:Number,
        default:0,
    },
    verificationResendWindowStart:{
        type:Date,
        default:null,
    },
    // When the current code was issued — drives the resend cooldown.
    verificationLastIssuedAt:{
        type:Date,
        default:null,
    },
    passwordResetToken:{
        type:String,
        default:"",
    },
    passwordResetTokenExpiry:{
        type:Date,
        default:null,
    },
},{timestamps:true})
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});
userSchema.methods.isPasswordCorrect = async function
(password) {
    return await bcrypt.compare(password,this.password)

    
}
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            
            
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d",
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            // Fallback required: jsonwebtoken throws "expiresIn should be a
            // number of seconds or string representing a timespan" when this
            // is undefined, which 500s every login. Matches the default in
            // tests/setup-env.js; production should still set it explicitly.
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d",
        }
    )

}
export const User = mongoose.model("User",userSchema)