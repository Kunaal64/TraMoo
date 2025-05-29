const mongoose = require("mongoose");

const blogscheme = mongoose.Schema({
    Title:String,
    Subtitle:String,
    Content:String,
    Image:String,
    Owner:String
})


const Blogmodel = mongoose.model("blog",blogscheme);

module.exports={
    Blogmodel
}