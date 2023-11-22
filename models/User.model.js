import mongoose from "mongoose";

const Schema = mongoose.Schema;
const UserSchema = new Schema({
    username:{
        type: String,
        default: null,
    },
    firstname:{
        type: String,
        default:null,
    },
    lastname:{
        type: String,
        default:null,
    },
    email:{
        type: String,
        required: true,
    },
    password:{
        type: String,
        required: true,
    },
    bio:{
        type: String,
        default: null,
        maxLength: 1000,
    },
    ProfilePic:{
        type:String,
        default:null,
    },
    followers:{
        type: Array,
        default: [],
    },
    following:{
        type: Array,
        default: [],
    },
    createdAt:{
        type: Date,
        default: Date.now(),
    }
});

export default mongoose.model('User', UserSchema)