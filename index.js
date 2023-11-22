import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import UserRouter from "./routers/user.router"; 
import PostRouter from "./routers/post.router";
import cors from "cors";


var app = express();
dotenv.config();

const PORT = process.env.PORT || 8007;

app.use(express.json())
app.use(express.static(__dirname))


var corsOptions = {
    origin: ["*" ,"http://localhost:3000"],
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }
app.use(cors(corsOptions))

mongoose
.connect(process.env.MONGO_DB_URL)
.then(()=> {
    console.log("MongoDB is Connected Successfully!!!")
});

app.listen(PORT, ()=>{
    console.log("Server running on http://localhost:"+ PORT)
})


app.use("/user", UserRouter);
app.use("/post", PostRouter);



// mongoose
// .connect('mongodb://localhost:27017/socialmediaDB')
// .then(() => console.log('Connected!'));