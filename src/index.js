// require('dotenv').config({path: './env'})
import mongoose from "mongoose";
import dotenv from 'dotenv';

import connectDB from "./db/index.js";
import { app } from "./app.js";

mongoose.set("strictQuery", false)


dotenv.config({
    path: "./env"
})

connectDB()
.then(() => {
     app.on("error", (error) => {
          console.log("ERR:", error);
          throw error       
     })
     app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at PORT: ${process.env.PORT}`);
     })
})
.catch((error) => {
   console.log("MongoDB connection fail:", error);
})




/*
import express from "express";
const app = express()

;( async () => {
    try {
       await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
       app.on("error", (error) => {
        console.log("error:", error);
       } ) 

       app.listen(process.env.PORT, () => {
        console.log(`app is listening on port ${process.env.PORT}`);
        
       })

    } catch (error) {
        console.error("ERROR",error);
        throw err     
    }
}) ()
    */