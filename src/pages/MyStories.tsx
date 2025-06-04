import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PenTool, BookOpen, Users, Award, Calendar, User, Trash2, Edit, Save, PlusCircle, Image as ImageIcon, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Markdown from 'react-markdown';
import BlogCard from '../components/BlogCard';
import { Link } from 'react-router-dom';
import { apiService } from '../utils/api';
import { getInitials } from '../utils/helpers';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

interface WriterStats {
  storiesWritten: number;
  totalReads: number;
  activeWriters: number;
  featuredStories: number;
}

interface Story {
  id: string;
  title: string;
  excerpt: string;
  author: {
    name: string;
    avatar: string;
  };
  readTime: number;
  publishedAt: string;
  reads: number;
  featured: boolean;
}

const WritersCorner = () => {
  const { toast } = useToast();
  const { user, token, loading: authLoading } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBlog, setCurrentBlog] = useState({
    _id: '',
    title: '',
    subtitle: '',
    content: '',
    excerpt: '',
    tags: [],
    images: [],
    published: true,
    country: '',
  });
  const [myBlogs, setMyBlogs] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [newImageLink, setNewImageLink] = useState('');
  const [isFetchingBlogs, setIsFetchingBlogs] = useState(false);
  const [error, setError] = useState(null);
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

  interface MyStoriesResponse {
    blogs: any[];
    total: number;
    page: number;
  }

  const fetchMyBlogs = async () => {
    if (!user || !token) {
      return;
    }
    setIsFetchingBlogs(true);
    try {
      const response = await apiService.request<MyStoriesResponse>('/blogs/my-stories');
      setMyBlogs(response.blogs || []);
    } catch (err) {
      setError(err);
      toast({
        title: "Error",
        description: "Failed to load your blogs.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingBlogs(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && token) {
      fetchMyBlogs();
    } else {
    }
  }, [user, token, authLoading]);

  useEffect(() => {
    if (currentBlog?.images && currentBlog.images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % currentBlog.images.length);
      }, 5000); // 5 seconds
      return () => clearInterval(interval);
    }
  }, [currentBlog]);

  const handleLikeToggle = async (blogId: string) => {
    if (!user || !token) {
      toast({
        title: 'Authentication Required',
        description: 'You need to be logged in to like a post.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const response = await apiService.likeBlog(blogId);
      setMyBlogs(prevBlogs => 
        prevBlogs.map(blog => 
          blog._id === blogId ? { ...blog, likes: response.likes } : blog
        )
      );
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update like status.',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentBlog({ ...currentBlog, [name]: value });
  };

  const handleTagAdd = () => {
    if (newTag.trim() && !currentBlog.tags.includes(newTag.trim())) {
      setCurrentBlog({ ...currentBlog, tags: [...currentBlog.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setCurrentBlog({ ...currentBlog, tags: currentBlog.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleImageLinkAdd = () => {
    console.log('MyStories.tsx: Before adding image, currentBlog.images:', currentBlog.images);
    if (newImageLink.trim() && !currentBlog.images.includes(newImageLink.trim())) {
      setCurrentBlog({ ...currentBlog, images: [...currentBlog.images, newImageLink.trim()] });
      console.log('MyStories.tsx: After adding image, currentBlog.images:', [...currentBlog.images, newImageLink.trim()]);
      setNewImageLink('');
    }
  };

  const handleImageRemove = (imageToRemove) => {
    setCurrentBlog({ ...currentBlog, images: currentBlog.images.filter(image => image !== imageToRemove) });
  };

  const generateExcerpt = (content) => {
    const strippedContent = content.replace(/\#+|\*+|\_|- |\[.*?\]|\(.*?\)/g, '').trim();
    return strippedContent.substring(0, 150) + (strippedContent.length > 150 ? '...' : '');
  };

  const handleSubmit = async (isPublished = true) => {
    setIsFetchingBlogs(true);
    setError(null);
    try {
      let imageUrls = [...currentBlog.images];

      const blogData = {
        title: currentBlog.title,
        subtitle: currentBlog.subtitle,
        content: currentBlog.content,
        excerpt: currentBlog.excerpt || generateExcerpt(currentBlog.content),
        tags: currentBlog.tags,
        images: imageUrls,
        published: isPublished,
        country: currentBlog.country,
      };
      console.log('MyStories.tsx: Submitting blogData with images:', blogData.images);

      if (isEditing) {
        await apiService.updateBlog(currentBlog._id, blogData);
        toast({
          title: "Success",
          description: `Blog ${isPublished ? 'published' : 'saved as draft'} successfully.`, 
        });
      } else {
        await apiService.createBlog(blogData);
        toast({
          title: "Success",
          description: `Blog ${isPublished ? 'published' : 'saved as draft'} successfully.`, 
        });
      }
      
      setIsCreating(false);
      setIsEditing(false);
      setCurrentBlog({
        _id: '',
        title: '',
        subtitle: '',
        content: '',
        excerpt: '',
        tags: [],
        images: [],
        published: true,
        country: '',
      });
      fetchMyBlogs();
    } catch (err) {
      console.error('Error saving blog:', err);
      setError(err);
      toast({
        title: "Error",
        description: "Failed to save blog.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingBlogs(false);
    }
  };

  const handleEdit = (blog) => {
    setIsEditing(true);
    setIsCreating(true);
    setCurrentBlog({
      ...blog,
      country: blog.country || '',
    });
  };

  const handleDelete = async (id) => {
    setIsFetchingBlogs(true);
    setError(null);
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/blogs/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: "Success",
        description: "Blog deleted successfully.",
      });
      fetchMyBlogs();
    } catch (err) {
      console.error('Error deleting blog:', err);
      setError(err);
      toast({
        title: "Error",
        description: "Failed to delete blog.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingBlogs(false);
    }
  };

  const handleDeleteComment = async (blogId, commentId) => {
    if (!user || !token) {
      toast({
        title: 'Authentication Required',
        description: 'You need to be logged in to delete a comment.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await apiService.request(`/blogs/${blogId}/comments/${commentId}`, { method: 'DELETE' });
      setCurrentBlog((prev) => ({
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

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Writers Corner
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Share your travel stories and connect with fellow writers from around the world
          </p>
          <Button
            onClick={() => { setIsCreating(true); setIsEditing(false); setCurrentBlog({ _id: '', title: '', subtitle: '', content: '', excerpt: '', tags: [], images: [], published: true, country: '' }); setCurrentImageIndex(0); }}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <PenTool className="w-4 h-4 mr-2" />
            Create New Story
          </Button>
        </motion.div>

        {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            className="glass p-8 rounded-2xl shadow-lg mb-12"
          >
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {isEditing ? 'Edit Your Story' : 'Create New Story'}
            </h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <div className="mb-4">
                <Label htmlFor="title" className="block text-foreground text-sm font-bold mb-2">Title</Label>
                <Input type="text" id="title" name="title" value={currentBlog.title} onChange={handleInputChange} required className="glass-input" />
              </div>
              <div className="mb-4">
                <Label htmlFor="subtitle" className="block text-foreground text-sm font-bold mb-2">Subtitle</Label>
                <Input type="text" id="subtitle" name="subtitle" value={currentBlog.subtitle} onChange={handleInputChange} className="glass-input" />
              </div>
              <div className="mb-4">
                <Label htmlFor="country" className="block text-foreground text-sm font-bold mb-2">Country</Label>
                <Input type="text" id="country" name="country" value={currentBlog.country} onChange={handleInputChange} className="glass-input" />
              </div>
              <div className="mb-4">
                <Label htmlFor="content" className="block text-foreground text-sm font-bold mb-2">Content (Markdown supported)</Label>
                <Textarea id="content" name="content" value={currentBlog.content} onChange={handleInputChange} required className="glass-textarea h-48" />
              </div>
              <div className="mb-4">
                <Label htmlFor="tags" className="block text-foreground text-sm font-bold mb-2">Tags (comma-separated)</Label>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {currentBlog.tags.map((tag, index) => (
                    <span key={index} className="bg-secondary text-secondary-foreground text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      {tag}
                      <button type="button" onClick={() => handleTagRemove(tag)} className="ml-1 text-destructive hover:text-destructive/80">x</button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleTagAdd(); } }} placeholder="Add a tag" className="glass-input flex-grow" />
                  <Button type="button" onClick={handleTagAdd} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
                    Add Tag
                  </Button>
                </div>
              </div>
              <div className="mb-6">
                <Label htmlFor="imageLink" className="block text-foreground text-sm font-bold mb-2">Embed Image Link</Label>
                <div className="flex space-x-2">
                  <Input type="url" id="imageLink" name="imageLink" value={newImageLink} onChange={(e) => setNewImageLink(e.target.value)} placeholder="Paste image URL" className="glass-input flex-grow" />
                  <Button type="button" onClick={handleImageLinkAdd} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
                    Add Link
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {currentBlog.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img src={getFullImageUrl(image)} alt={`Image ${index + 1}`} className="w-24 h-24 object-cover rounded-md" />
                      <button type="button" onClick={() => handleImageRemove(image)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {error && <p className="text-destructive text-sm mb-4">Error: {error.message}</p>}

              <div className="flex space-x-4">
                <Button type="submit" disabled={isFetchingBlogs} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {isFetchingBlogs ? 'Saving...' : (isEditing ? 'Update Story' : 'Publish Story')}
                </Button>
                <Button type="button" onClick={() => handleSubmit(false)} disabled={isFetchingBlogs} variant="outline" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                  Save as Draft
                </Button>
                <Button type="button" onClick={() => { setIsCreating(false); setIsEditing(false); setNewImageLink(''); setCurrentBlog({ _id: '', title: '', subtitle: '', content: '', excerpt: '', tags: [], images: [], published: true, country: '' }); }} variant="ghost">
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-foreground mb-8">
            My Stories
          </h2>
          {isFetchingBlogs && <p className="text-center text-muted-foreground">Loading your stories...</p>}
          {error && <p className="text-center text-destructive">Error loading stories.</p>}
          {!isFetchingBlogs && !myBlogs.length && <p className="text-center text-muted-foreground">You haven't written any stories yet. Start by creating a new one!</p>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {myBlogs.map((blog) => (
              blog._id && (
                <motion.div
                  key={blog._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="relative group"
                >
                  <Link to={`/blogs/${blog._id}`}>
                    <BlogCard 
                      {...blog} 
                      isLiked={user ? blog.likes.includes(user.id) : false} 
                      onLikeToggle={handleLikeToggle} 
                    />
                  </Link>
                  <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button variant="secondary" size="sm" onClick={() => handleEdit(blog)} className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-3xl">
                      <Edit size={16} />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(blog._id)} className="rounded-3xl">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </motion.div>
              )
            ))}
          </div>
        </motion.div>

        {/* Live Preview */}
        {currentBlog.content && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
            className="mt-12 p-8 rounded-2xl glass shadow-lg"
          >
            <h2 className="text-2xl font-bold text-foreground mb-6">Live Preview</h2>
            <div className="prose dark:prose-invert max-w-none text-foreground">
              <h1 className="text-4xl font-bold mb-2">{currentBlog.title}</h1>
              {currentBlog.subtitle && <h2 className="text-2xl text-muted-foreground mb-4">{currentBlog.subtitle}</h2>}
              {currentBlog.images && currentBlog.images.length > 0 && (
                <div className="relative h-64 w-full overflow-hidden rounded-lg mb-6">
                  <img
                    src={getFullImageUrl(currentBlog.images[currentImageIndex])}
                    alt={currentBlog.title}
                    className="w-full h-full object-cover"
                  />
                  {currentBlog.images.length > 1 && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                      {currentBlog.images.map((_, idx) => (
                        <span
                          key={idx}
                          className={`block w-2 h-2 rounded-full ${idx === currentImageIndex ? 'bg-orange-500' : 'bg-gray-400'}`}
                        />
                      ))}
                    </div>
                  )}
                  {currentBlog.images.length > 1 && (
                    <>
                      <Button onClick={() => setCurrentImageIndex((prev) => (prev - 1 + currentBlog.images.length) % currentBlog.images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-primary/50 hover:bg-primary/70 text-primary-foreground rounded-full p-2"><ArrowLeft size={20} /></Button>
                      <Button onClick={() => setCurrentImageIndex((prev) => (prev + 1) % currentBlog.images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary/50 hover:bg-primary/70 text-primary-foreground rounded-full p-2"><ArrowRight size={20} /></Button>
                    </>
                  )}
                </div>
              )}
              <div className="text-foreground">
                <Markdown>{currentBlog.content}</Markdown>
              </div>
            </div>
        </motion.div>
        )}

        {/* Comments Section */}
        {isEditing && currentBlog.comments && currentBlog.comments.length > 0 && (
          <div className="mt-8 border-t border-border pt-8">
            <h4 className="text-2xl font-bold text-foreground mb-6">Comments ({currentBlog.comments.length})</h4>
            <div className="space-y-6 mb-8">
              {currentBlog.comments.map((comment, index) => (
                <div key={index} className="bg-card p-4 rounded-lg flex gap-3 border border-border items-start">
                  <Avatar className="w-10 h-10">
                    {comment.author?.avatar && <AvatarImage src={getFullImageUrl(comment.author.avatar)} alt={comment.author.name || 'Commenter Avatar'} />}
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg dark:bg-primary-foreground dark:text-primary">{getInitials(comment.author?.name || '')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-foreground text-md">{comment.author?.name || 'Anonymous User'}</p>
                      <p className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <p className="text-foreground mt-1 text-sm">{comment.content}</p>
                  </div>
                  {(user && user.id === currentBlog.author._id) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComment(currentBlog._id, comment._id)}
                      className="ml-auto mt-2 text-xs py-1 px-2 rounded-md transition-all duration-200 flex items-center gap-1 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 size={12} />
                      Delete
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default WritersCorner;
