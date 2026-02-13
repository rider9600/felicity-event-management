import user from "../models/user.js"
import bcrypt from "bcrypt";
const createadmin=async ()=>
{
    const adminexists=await user.findOne({role:"admin"});
    if(adminexists)
    {
        console.log("admin already on the action");
        return;
    }
    const hashed=await bcrypt.hash(process.env.admin_password,10);
    await user.create({
        firstname:"system",
        lastname:"head",
        email:process.env.admin_email,
        password:hashed,
        role:"admin",
        participantType:"non-iiit"
    })
    console.log("admin created with emails and passwords by env's key");
}
export default createadmin;