import dotenv from "dotenv"
dotenv.config({
    path: './.env'
})
import connectDB from "./db/index.js"
import app from "./app.js"
connectDB()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`App is listening on port ${process.env.PORT}`);
    });
})
.catch((error)=>{
    console.log("Mongo DB Error:",error);
    throw error
})

// Alternate method
// import mongoose from "mongoose"
// import {DB_NAME}from "./constants"
// import express from "express"
// const app = express()
// ;(async ()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//         app.on("error",()=>{
//             console.log("Error",error);
//             throw error 

//         })
//         app.listen(process.env.PORT,()=>{
//             console.log(`App is listening on port ${process.env.PORT}`);

//         })
//     } catch (error) {
//         console.log("Error:",error);
//         throw err
//     }
// })()

