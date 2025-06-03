import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Markdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, User, Heart, MessageSquare, ArrowLeft, ArrowRight } from 'lucide-react';
import { apiService } from '../utils/api';

const BlogDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const { user, token } = useAuth();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentContent, setCommentContent] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const getFullImageUrl = (path) => {
    if (!path) return '/placeholder-image.png';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `${import.meta.env.VITE_BACKEND_URL}${path}`;
  };

  useEffect(() => {
    const fetchBlog = async () => {
      if (!id) {
        setLoading(false);
        setError(new Error("Blog ID is missing."));
        return;
      }
      setLoading(true);
      try {
        const response = await apiService.getBlogById(id);
        setBlog(response);
      } catch (err) {
        setError(err);
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

  useEffect(() => {
    if (blog?.images && blog.images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % blog.images.length);
      }, 5000); // 5 seconds
      return () => clearInterval(interval);
    }
  }, [blog]);

  const handleLike = async () => {
    if (!user || !token || !blog?._id) {
      toast({
        title: 'Authentication Required',
        description: 'You need to be logged in to like a post or blog data is missing.',
        variant: 'destructive',
      });
      return;
    }
    setIsLiking(true);
    try {
      const response = await apiService.likeBlog(blog._id);
      setBlog((prev) => ({
        ...prev,
        likes: response.likes, // Ensure this is the full array from backend
      }));
      toast({
        title: 'Success',
        description: 'Like status updated.',
      });
    } catch (err) {
      console.error('Error updating like status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update like status.',
        variant: 'destructive',
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user || !token) {
      toast({
        title: 'Authentication Required',
        description: 'You need to be logged in to comment.',
        variant: 'destructive',
      });
      return;
    }
    if (!commentContent.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Comment cannot be empty.',
        variant: 'destructive',
      });
      return;
    }
    setIsCommenting(true);
    try {
      const response = await apiService.request(
        `/blogs/${id}/comment`,
        { method: 'POST', body: JSON.stringify({ content: commentContent }) }
      );
      setBlog((prev) => ({
        ...prev,
        comments: [...prev.comments, response.comment],
      }));
      setCommentContent('');
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to add comment.',
        variant: 'destructive',
      });
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!user || !token) {
      toast({
        title: 'Authentication Required',
        description: 'You need to be logged in to delete a comment.',
        variant: 'destructive',
      });
      return;
    }
    if (!blog?._id) {
      toast({
        title: 'Error',
        description: 'Blog ID is missing.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await apiService.request(`/blogs/${blog._id}/comments/${commentId}`, { method: 'DELETE' });
      setBlog((prev) => ({
        ...prev,
        comments: prev.comments.filter((comment) => comment._id !== commentId),
      }));
      toast({
        title: 'Success',
        description: 'Comment deleted successfully.',
      });
    } catch (err) {
      console.error('Error deleting comment:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete comment.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-600 dark:text-slate-400">Loading blog post...</div>;
  }

  if (error || !blog) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Error: Blog post not found.</div>;
  }

  const isLikedByUser = user && Array.isArray(blog.likes) && blog.likes.includes(user.id);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass p-8 rounded-2xl shadow-lg"
        >
          {blog.images?.length > 0 && (
            <div className="relative w-full h-96 rounded-lg overflow-hidden mb-6 group">
              <img src={getFullImageUrl(blog.images[currentImageIndex])} alt={blog.title} className="w-full h-full object-cover transition-transform duration-300" />
              {blog.images.length > 1 && (
                <>
                  <Button
                    onClick={() => setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? blog.images.length - 1 : prevIndex - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-primary/50 hover:bg-primary/70 text-primary-foreground p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <ArrowLeft size={24} />
                  </Button>
                  <Button
                    onClick={() => setCurrentImageIndex((prevIndex) => (prevIndex === blog.images.length - 1 ? 0 : prevIndex + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary/50 hover:bg-primary/70 text-primary-foreground p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <ArrowRight size={24} />
                  </Button>
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                    {blog.images.map((_, idx) => (
                      <span
                        key={idx}
                        className={`w-2 h-2 rounded-full ${currentImageIndex === idx ? 'bg-primary' : 'bg-muted-foreground/50'} cursor-pointer`}
                        onClick={() => setCurrentImageIndex(idx)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <h1 className="text-4xl font-bold text-foreground mb-2">{blog.title}</h1>
          {blog.subtitle && <h2 className="text-xl text-muted-foreground mb-4">{blog.subtitle}</h2>}

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-1"><User size={16} /><span>{blog.author?.name}</span></div>
            <div className="flex items-center gap-1"><Calendar size={16} /><span>{new Date(blog.createdAt).toLocaleDateString()}</span></div>
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-1 ${isLikedByUser ? 'text-destructive' : 'text-muted-foreground hover:text-primary'}`}
            >
              <Heart size={16} fill={isLikedByUser ? 'currentColor' : 'none'} />
              <span>{Array.isArray(blog.likes) ? blog.likes.length : 0}</span>
            </button>
            <div className="flex items-center gap-1"><MessageSquare size={16} /><span>{blog.comments.length}</span></div>
          </div>

          <div className="prose dark:prose-invert max-w-none text-foreground mb-8">
            <Markdown>{blog.content}</Markdown>
          </div>

          {/* Comments */}
          <div className="mt-8 border-t border-border pt-8">
            <h3 className="text-2xl font-bold text-foreground mb-6">Comments ({blog.comments.length})</h3>

            {blog.comments.length === 0 && <p className="text-muted-foreground">No comments yet.</p>}

            <div className="space-y-6 mb-8">
              {blog.comments.map((comment, index) => (
                <div key={index} className="bg-card p-4 rounded-lg flex gap-3 border border-border items-start">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-base font-medium overflow-hidden flex-shrink-0">
                    {comment.author?.avatar ? (
                      <img src={getFullImageUrl(comment.author.avatar)} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      comment.author?.name?.charAt(0)?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-foreground text-md">{comment.author?.name || 'Anonymous User'}</p>
                      <p className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p className="text-foreground mt-1 text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="mt-8 p-6 glass rounded-2xl shadow-lg">
              <h4 className="text-xl font-bold text-foreground mb-4">Add a Comment</h4>
              <Textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Write your comment..."
                rows={4}
                className="mb-4 border border-input bg-background text-foreground"
                required
              />
              <Button type="submit" disabled={isCommenting || !user} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-3xl">
                {isCommenting ? 'Posting...' : 'Post Comment'}
              </Button>
              {!user && <p className="text-destructive text-sm mt-2">You must be logged in to comment.</p>}
            </form>
          </div>
        </motion.article>
      </div>
    </div>
  );
};

export default BlogDetail;
