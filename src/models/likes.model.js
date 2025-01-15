import mongoose, {Schema} from "mongoose";


const likeSchema = new Schema({
    likeBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },

    comment: {
         type: Schema.Types.ObjectId,
         ref: "Comment"
    },

    video: {
         type: Schema.Types.ObjectId,
         ref: "Video"
    },

    twitter: {
         type: Schema.Types.ObjectId,
         ref: "Twitter"
    },

}, {timestamps: true});


export const Like = mongoose.model("Like", likeSchema)