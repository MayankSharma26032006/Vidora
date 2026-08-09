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
    // Display name — deliberately NOT lowercased so "John Doe" stays "John Doe"
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true,
    },
    avatar:{
        type:String,//cloudinary url
        required:true,

    },
    // Cloudinary public ids so replaced avatars/covers can be deleted (avoids
    // orphaned assets piling up on Cloudinary with every profile edit)
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
            // Access tokens must stay short-lived even if the env var is
            // missing — never inherit the (30d) refresh expiry for them.
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
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    )

}
export const User = mongoose.model("User",userSchema)