import dotenv from "dotenv"
import connectDB from "./db/index.js";
dotenv.config({
    path : "./.env"
})

connectDB()
.then(() => {
    app.on("errror", (req, res) => {
        console.log("ERRR:", error)
        throw error
    })
    app.listen(process.env.PORT || 8000 , (req, res) => {
        console.log(`₩₩ server is listening on port ${process.env.PORT}`)
    })
})
.catch((error) => {
    console.log("MONGODB connection error at index.js: ", error)
})



/*

import mongoose from "mongoose";
import { DB_NAME } from "./constants";

import express from "express";
const app = express()
;(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("errror", (error) =>{
            console.log("ERRR:", error);
            throw error
        })
        app.listen(process.env.PORT , ()=>{
            console.log(`Listening on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("error:",error)
        throw error
    }
})()

*/