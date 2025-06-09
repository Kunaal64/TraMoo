import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../utils/api';

const EditBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token } = useAuth();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await apiService.getBlogById(id);
        setBlog(response);
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to load blog post.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [id, toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBlog({ ...blog, [name]: value });
  };

  const handleImageLinkChange = (e) => {
    setBlog({ ...blog, images: [e.target.value] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.updateBlog(id, blog);
      toast({
        title: 'Success',
        description: 'Blog updated successfully.',
      });
      navigate(`/blogs/${id}`);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update blog.',
        variant: 'destructive',
      });
    }
  };

  if (loading || !blog) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" value={blog.title} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input id="subtitle" name="subtitle" value={blog.subtitle} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" name="content" value={blog.content} onChange={handleInputChange} rows={10} />
            </div>
            <div>
              <Label htmlFor="image">Blog Image URL</Label>
              <Input id="image" name="image" type="text" value={blog.images ? blog.images[0] : ''} onChange={handleImageLinkChange} />
            </div>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditBlog; 