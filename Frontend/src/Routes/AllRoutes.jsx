import React from 'react';
import {Route,Routes} from "react-router-dom"
import Home from '../Pages/Home';
import Blogs from '../Pages/Blogs'
import WritersCorner from '../Pages/WritersCorner';
import Createblog from '../Pages/Createblog';
import Gallery from '../Pages/Gallery';
import Login from '../Pages/Login';
import Signup from '../Pages/Signup';
import ReadBlog from '../Pages/ReadBlog';
import EditBlog from '../Pages/EditBlog';
function AllRoutes(props) {
    const {islogged,setIslogged}=props;
    return (
        <div>
            <Routes>
                <Route path='/' element={<Home/>}/>
                <Route path='/blogs' element={islogged?<Blogs/>:<Login setIslogged={setIslogged}/>}/>
                <Route path='/gallery' element={<Gallery/>}/>
                <Route path='/login' element={<Login setIslogged={setIslogged}/>}/>
                <Route path='/signup' element={<Signup/>}/>
                <Route path='/createblog' element={<Createblog/>}/>
                <Route path='/corner' element={<WritersCorner/>}/>
                <Route path='/blogs/:id' element={<ReadBlog/>}/>
                <Route path='/editblogs/:id' element={<EditBlog/>}/>
            </Routes>
        </div>
    );
}

export default AllRoutes;