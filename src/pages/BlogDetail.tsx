import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Markdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, User, Heart, MessageSquare, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { apiService } from '../utils/api';
import { getInitials } from '../utils/helpers';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

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
    if (!path) return '/images/placeholder.svg';
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
          className="glass p-8 rounded-2xl shadow-lg border border-border"
        >
          {blog.images?.length > 0 && (
            <div className="relative w-full h-96 rounded-lg overflow-hidden mb-8 group">
              <img src={getFullImageUrl(blog.images[currentImageIndex])} alt={blog.title} className="w-full h-full object-cover transition-transform duration-500 ease-in-out" />
              {blog.images.length > 1 && (
                <>
                  <Button
                    onClick={() => setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? blog.images.length - 1 : prevIndex - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-primary/70 hover:bg-primary text-primary-foreground p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 shadow-md"
                  >
                    <ArrowLeft size={28} />
                  </Button>
                  <Button
                    onClick={() => setCurrentImageIndex((prevIndex) => (prevIndex === blog.images.length - 1 ? 0 : prevIndex + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary/70 hover:bg-primary text-primary-foreground p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 shadow-md"
                  >
                    <ArrowRight size={28} />
                  </Button>
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                    {blog.images.map((_, idx) => (
                      <span
                        key={idx}
                        className={`w-3 h-3 rounded-full transition-colors duration-300 ${currentImageIndex === idx ? 'bg-primary scale-125' : 'bg-muted-foreground/60'} cursor-pointer`}
                        onClick={() => setCurrentImageIndex(idx)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <h1 className="text-5xl font-extrabold text-foreground mb-3 leading-tight">{blog.title}</h1>
          {blog.subtitle && <h2 className="text-2xl text-muted-foreground mb-6 font-medium">{blog.subtitle}</h2>}

          <div className="flex flex-wrap items-center gap-6 text-base text-muted-foreground mb-8 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm dark:bg-primary-foreground dark:text-primary">{getInitials(blog.author?.name || 'Unknown')}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-lg text-foreground">
                {blog.author?.name || 'Unknown Author'}
              </span>
            </div>
            <div className="flex items-center gap-2"><Calendar size={18} className="text-primary" /><span>{new Date(blog.createdAt).toLocaleDateString()}</span></div>
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-2 transition-colors duration-200 ${isLikedByUser ? 'text-destructive' : 'text-muted-foreground hover:text-primary'}`}
            >
              <Heart size={18} fill={isLikedByUser ? 'currentColor' : 'none'} />
              <span>{Array.isArray(blog.likes) ? blog.likes.length : 0}</span>
            </button>
            <div className="flex items-center gap-2"><MessageSquare size={18} className="text-primary" /><span>{blog.comments.length}</span></div>
          </div>

          <div className="prose dark:prose-invert max-w-none text-foreground leading-relaxed mb-8">
            <Markdown>{blog.content}</Markdown>
          </div>

          {/* Comments */}
          <div className="mt-8 border-t border-border pt-8">
            <h3 className="text-3xl font-bold text-foreground mb-8">Comments ({blog.comments.length})</h3>

            <form onSubmit={handleAddComment} className="mb-8 p-4 border border-border rounded-lg bg-card shadow-sm">
              <Textarea
                placeholder="Write your comment here..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="w-full mb-4 bg-background text-foreground border-input focus-visible:ring-ring"
                rows={4}
              />
              <Button type="submit" disabled={isCommenting || !commentContent.trim()} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
                {isCommenting ? 'Posting...' : 'Add Comment'}
              </Button>
            </form>

            <div className="space-y-6">
              {blog.comments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
              ) : (
                blog.comments.map((comment) => (
                  <motion.div
                    key={comment._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start space-x-4 p-4 rounded-lg bg-card border border-border shadow-sm"
                  >
                    <div className="flex-shrink-0">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg dark:bg-primary-foreground dark:text-primary">{getInitials(comment.author?.name || 'Unknown')}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-semibold text-foreground">{comment.author?.name || 'Unknown User'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <p className="text-foreground mt-1">{comment.content}</p>
                      {user && user.id === comment.author?._id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment._id)}
                          className="ml-auto mt-2 text-xs py-1 px-2 rounded-md transition-all duration-200 flex items-center gap-1 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 size={12} />
                          Delete
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.article>
      </div>
    </div>
  );
};

export default BlogDetail;
