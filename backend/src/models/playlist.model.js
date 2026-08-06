import mongoose, {Schema, SchemaType } from "mongoose"
const playlistSchema = new Schema({
    name:{
        type:String,
        required:true

    },
    description:{
        type:String,
        default:""


    },
    videos:[
        {
        type:Schema.Types.ObjectId,
        ref:"Video"
        }

    ],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"

    }

},{timestamps:true})
export const Playlist = mongoose.model("Playlist",playlistSchema)