import React from "react";
import ReadComp from "../Components/ReadComp";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
function ReadBlog(props) {
  let { id } = useParams();
  let [Blog, SetBlog] = useState({});
  useEffect(() => {
    let token = localStorage.getItem("token");
    fetch(`http://localhost:8000/blogs/${id}`, {
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((response) => {
        SetBlog(response.blog);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [id]);
  return (
    <div>
      <ReadComp
        Title={Blog.Title}
        Subtitle={Blog.Subtitle}
        Content={Blog.Content}
        Image={Blog.Image}
      />
    </div>
  );
}

export default ReadBlog;
