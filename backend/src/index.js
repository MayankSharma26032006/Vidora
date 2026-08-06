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

