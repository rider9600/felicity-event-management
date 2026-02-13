import mongoose from "mongoose";
const connectdb=async()=>
{
    try
    {
    await mongoose.connect(process.env.mongoconnection);
    console.log("lesss go connected");
    }
    catch(err)
    {
    console.log(err);
    process.exit(1);
   }
};
export default connectdb;