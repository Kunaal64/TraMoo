require("dotenv").config();

const express = require("express");
const connection = require("./db");
const {Usermodel} = require("./User.model");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const {Blogmodel} = require("./Blog.model")

const app = express();

app.use(express.json());
app.use(cors());

app.get("/",(req,res)=>{
    res.send("Basic Route");
})

// Signup
app.post("/signup",async(req,res)=>{
    let {Name,Email,Role,Password} = req.body;
    const HashedPassword = bcrypt.hashSync(Password,8);
    const new_user = new Usermodel({
        Name,
        Email,
        Role,
        Password:HashedPassword
    });
    await new_user.save();
    res.send("Signup Successful");
})

// login
app.post("/login",async(req,res)=>{
    let {Email,Password} = req.body;
    const user = await Usermodel.findOne({Email});
    if(!user){
       return res.send({"Message":"Please Signup !"})
    }
    const hash = user.Password;
    const correct_password = bcrypt.compareSync(Password,hash);
    if(correct_password){
        const token = jwt.sign({UserID:user._id},"SecretCode");
        res.send({"user":user,"Message":"Login Successful !","token":token});
    }
    else{
        res.send({"Message":"Failed to Signup !"})
    }
})

// Blogs Crud

app.post("/blogs",async(req,res)=>{
    let {Title,Subtitle,Content,Image} = req.body;
    const token = req.headers.authorization.split(" ")[1];
    if(!token){
        return res.send({"Message":"Please Login !"});
    }
    jwt.verify(token,"SecretCode",async(error,decoded)=>{
        if(decoded){
            const new_blog = new Blogmodel({
                Title,
                Subtitle,
                Content,
                Image,
                Owner:decoded.UserID
            })
            await new_blog.save();
            res.send({"Message":"Blog Created!"});
        }
        else{
            res.send({"Message":"Please Login !"})
        }
    })
})

app.get("/blogs",async(req,res)=>{
    const token = req.headers.authorization.split(" ")[1];
    if(!token){
        return res.send({"Message":"Please Login !"});
     }
     jwt.verify(token,"SecretCode",async(error,decoded)=>{
         if(decoded){
             console.log(decoded);
             const blogs = await Blogmodel.find({});
             res.send({blogs});
         }
         else{
             res.send({"Message":"Please Login !"});
         }
     })
})

app.get("/blogsowner",async(req,res)=>{
    const token = req.headers.authorization.split(" ")[1];
    if(!token){
        return res.send({"Message":"Please Login !"});
     }
     jwt.verify(token,"SecretCode",async(error,decoded)=>{
         if(decoded){
             console.log(decoded);
             const blogs = await Blogmodel.find({Owner:decoded.UserID});
             res.send({blogs});
         }
         else{
             res.send({"Message":"Please Login !"});
         }
     })
})

app.get("/blogs/:id",async(req,res)=>{
    const {id} = req.params;
    const token = req.headers.authorization.split(" ")[1];
    if(!token){
        return res.send({"Message":"Please Login !"});
    }
    jwt.verify(token,"SecretCode",async(error,decoded)=>{
        if(decoded){
            console.log(decoded);
            const blog = await Blogmodel.findOne({_id:id});
            res.send({blog});
        }
        else{
            res.send({"Message":"Please Login "});
        }
    })

})

app.put("/blogs/:id",async(req,res)=>{
    const {id} = (req.params);
    let {Title,Subtitle,Content,Image} = req.body;
    const token = req.headers.authorization.split(" ")[1];
    if(!token){
        return res.send({"Message":"Please Login !"});
     }
     jwt.verify(token,"SecretCode",async(error,decoded)=>{
        if(decoded){
           const payload = {
                Title,
                Subtitle,
                Content,
                Image,
                owner:decoded.userId,
            }
            const updateblog = await Blogmodel.findOneAndUpdate({_id:id},payload);
            res.send({"Message":"Blog Updated !"})
        }
        else{
            res.send({"Message":"Please Login !"});
        }
})
})

app.delete("/blogs/:id",async(req,res)=>{
    const{id} = req.params;
    await Blogmodel.findByIdAndDelete({_id:id});
    res.send({"Message":"Blog Deleted !"})
})


app.listen(process.env.PORT,async()=>{
    try {
        connection;
        console.log("Connected to mongoDb on port 8000");
    } catch (error) {
        console.log("Error Connecting MongoDb");
        console.log(error);
    }
})