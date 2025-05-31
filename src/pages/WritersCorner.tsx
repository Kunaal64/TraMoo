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
  const { user, token } = useAuth();
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
  });
  const [myBlogs, setMyBlogs] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [newImageLink, setNewImageLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const getFullImageUrl = (path) => {
    if (!path) return ''; // Return empty string for WritersCorner as it might not always have a placeholder
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `${import.meta.env.VITE_BACKEND_URL}${path}`;
  };

  const fetchMyBlogs = async () => {
    if (!user || !token) return;
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/blogs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { author: user.id }, // Assuming backend supports filtering by author
      });
      setMyBlogs(response.data.blogs || []);
    } catch (err) {
      console.error('Error fetching my blogs:', err);
      setError(err);
      toast({
        title: "Error",
        description: "Failed to load your blogs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBlogs();
  }, [user, token]);

  useEffect(() => {
    if (currentBlog?.images && currentBlog.images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % currentBlog.images.length);
      }, 5000); // 5 seconds
      return () => clearInterval(interval);
    }
  }, [currentBlog]);

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
    if (newImageLink.trim() && !currentBlog.images.includes(newImageLink.trim())) {
      setCurrentBlog({ ...currentBlog, images: [...currentBlog.images, newImageLink.trim()] });
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
    setLoading(true);
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
      };

      if (isEditing) {
        await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/blogs/${currentBlog._id}`, blogData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        toast({
          title: "Success",
          description: `Blog ${isPublished ? 'published' : 'saved as draft'} successfully.`, 
        });
      } else {
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/blogs`, blogData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
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
      setLoading(false);
    }
  };

  const handleEdit = (blog) => {
    setIsEditing(true);
    setIsCreating(true);
    setCurrentBlog(blog);
  };

  const handleDelete = async (id) => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Writers Corner
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
            Share your travel stories and connect with fellow writers from around the world
          </p>
          <Button
            onClick={() => { setIsCreating(true); setIsEditing(false); setCurrentBlog({ _id: '', title: '', subtitle: '', content: '', excerpt: '', tags: [], images: [], published: true }); }}
            className="bg-slate-900 dark:bg-slate-100 text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200"
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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              {isEditing ? 'Edit Your Story' : 'Create New Story'}
            </h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <div className="mb-4">
                <Label htmlFor="title" className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">Title</Label>
                <Input type="text" id="title" name="title" value={currentBlog.title} onChange={handleInputChange} required className="glass-input" />
              </div>
              <div className="mb-4">
                <Label htmlFor="subtitle" className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">Subtitle</Label>
                <Input type="text" id="subtitle" name="subtitle" value={currentBlog.subtitle} onChange={handleInputChange} className="glass-input" />
              </div>
              <div className="mb-4">
                <Label htmlFor="content" className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">Content (Markdown supported)</Label>
                <Textarea id="content" name="content" value={currentBlog.content} onChange={handleInputChange} required className="glass-textarea h-48" />
              </div>
              <div className="mb-4">
                <Label htmlFor="tags" className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">Tags (comma-separated)</Label>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {currentBlog.tags.map((tag, index) => (
                    <span key={index} className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      {tag}
                      <button type="button" onClick={() => handleTagRemove(tag)} className="ml-1 text-red-500 hover:text-red-700">x</button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleTagAdd(); } }} placeholder="Add a tag" className="glass-input flex-grow" />
                  <Button type="button" onClick={handleTagAdd} className="bg-slate-700 hover:bg-slate-600 dark:bg-slate-300 dark:hover:bg-slate-400 text-white dark:text-black">
                    Add Tag
                  </Button>
                </div>
              </div>
              <div className="mb-6">
                <Label htmlFor="imageLink" className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">Embed Image Link</Label>
                <div className="flex space-x-2">
                  <Input type="url" id="imageLink" name="imageLink" value={newImageLink} onChange={(e) => setNewImageLink(e.target.value)} placeholder="Paste image URL" className="glass-input flex-grow" />
                  <Button type="button" onClick={handleImageLinkAdd} className="bg-slate-700 hover:bg-slate-600 dark:bg-slate-300 dark:hover:bg-slate-400 text-white dark:text-black">
                    Add Link
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {currentBlog.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img src={getFullImageUrl(image)} alt={`Image ${index + 1}`} className="w-24 h-24 object-cover rounded-md" />
                      <button type="button" onClick={() => handleImageRemove(image)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {error && <p className="text-red-500 text-sm mb-4">Error: {error.message}</p>}

              <div className="flex space-x-4">
                <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
                  {loading ? 'Saving...' : (isEditing ? 'Update Story' : 'Publish Story')}
                </Button>
                <Button type="button" onClick={() => handleSubmit(false)} disabled={loading} variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                  Save as Draft
                </Button>
                <Button type="button" onClick={() => { setIsCreating(false); setIsEditing(false); setNewImageLink(''); setCurrentBlog({ _id: '', title: '', subtitle: '', content: '', excerpt: '', tags: [], images: [], published: true }); }} variant="ghost">
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-8">
            My Stories
          </h2>
          {loading && <p className="text-center text-slate-600 dark:text-slate-400">Loading your stories...</p>}
          {error && <p className="text-center text-red-500">Error loading stories.</p>}
          {!loading && !myBlogs.length && <p className="text-center text-slate-600 dark:text-slate-400">You haven't written any stories yet. Start by creating a new one!</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {myBlogs.map((blog) => (
              blog._id && (
                <motion.div
                  key={blog._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <BlogCard {...blog} />
                  <div className="flex items-center justify-end space-x-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(blog)}>
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(blog._id)}>
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </div>
                </motion.div>
              )
            ))}
          </div>
        </motion.div>

        {/* Preview Section */}
        {currentBlog.title && currentBlog.content && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-8 rounded-2xl shadow-lg mb-12"
          >
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Preview</h2>
            <article className="prose dark:prose-invert max-w-none blog-content">
              <h1 className="text-3xl font-bold mb-2">{currentBlog.title}</h1>
              {currentBlog.subtitle && <h2 className="text-xl text-slate-600 dark:text-slate-400 mb-4">{currentBlog.subtitle}</h2>}
              <div className="flex flex-wrap gap-2 mb-4">
                {currentBlog.tags.map(tag => (
                  <span key={tag} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              {currentBlog.images?.length > 0 && (
                <div className="relative w-full h-96 rounded-lg overflow-hidden mb-6 group">
                  <img src={currentBlog.images[currentImageIndex]} alt={currentBlog.title} className="w-full h-full object-cover transition-transform duration-300" />
                  {currentBlog.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? currentBlog.images.length - 1 : prevIndex - 1))}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <ArrowLeft size={24} />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((prevIndex) => (prevIndex === currentBlog.images.length - 1 ? 0 : prevIndex + 1))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <ArrowRight size={24} />
                      </button>
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                        {currentBlog.images.map((_, idx) => (
                          <span
                            key={idx}
                            className={`w-2 h-2 rounded-full ${currentImageIndex === idx ? 'bg-white' : 'bg-white/50'} cursor-pointer`}
                            onClick={() => setCurrentImageIndex(idx)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              <Markdown>{currentBlog.content}</Markdown>
            </article>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default WritersCorner;
