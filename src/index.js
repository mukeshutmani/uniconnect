// require('dotenv').config({path: './env'})
import mongoose from "mongoose";
import dotenv from 'dotenv';

import connectDB from "./db/index.js";

mongoose.set("strictQuery", false)



connectDB()


dotenv.config({
    path: "./env"
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