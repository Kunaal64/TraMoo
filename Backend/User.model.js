const mongoose = require("mongoose");

const userscheme = mongoose.Schema({
    Name:String,
    Email:String,
    Role:String,
    Password:String
})


const Usermodel = mongoose.model("user",userscheme);

module.exports={
    Usermodel
}