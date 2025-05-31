// Backend Server Configuration for MongoDB Atlas
// This is a Node.js/Express server template

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(morgan('dev'));
app.use(helmet());
app.use(compression());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://dummyuser:dummypassword@cluster0.dummy.mongodb.net/wanderlust?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((error) => console.error('MongoDB connection error:', error));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpeg, jpg, png, gif) are allowed'));
  }
});

// Schemas
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  countriesExplored: { type: Number, default: 0 },
  photosShared: { type: Number, default: 0 },
  storiesWritten: { type: Number, default: 0 },
  joinedAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

UserSchema.index({ email: 1 }); // Index on email for faster lookups

const BlogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  content: { type: String, required: true },
  excerpt: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [{ type: String }],
  images: [{ type: String }],
  location: {
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  featured: { type: Boolean, default: false },
  published: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    createdAt: { type: Date, default: Date.now }
  }],
  readTime: { type: Number, default: 5 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Blog = mongoose.model('Blog', BlogSchema);

// Helper to extract userId from dummy token
const extractUserId = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer dummy-jwt-token-')) return null;
  return authHeader.replace('Bearer dummy-jwt-token-', '');
};

// Routes

// Auth Routes
app.post('/api/auth/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = `dummy-jwt-token-${user._id}`;
    res.status(201).json({
      message: 'User created successfully',
      user: { id: user._id, name: user.name, email: user.email },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    user.lastActive = new Date();
    await user.save();

    const token = `dummy-jwt-token-${user._id}`;
    res.json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const userId = extractUserId(req.headers.authorization);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// User Stats Route
app.get('/api/user-stats', async (req, res) => {
  try {
    const [totalUsers, totalBlogs, ] = await Promise.all([
      User.countDocuments(),
      Blog.countDocuments(),
    ]);

    const totalCountries = Math.floor(totalUsers * 2.5);
    res.json({ countriesExplored: totalCountries, photosShared: 0, storiesWritten: totalBlogs, communityMembers: totalUsers });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Blog Routes
app.get('/api/blogs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query._limit || req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const query = {};
    if (req.query.author) {
      query.author = req.query.author;
    }
    if (req.query.featured) {
      query.featured = req.query.featured === 'true';
    }

    const [blogs, total] = await Promise.all([
      Blog.find(query).populate('author', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Blog.countDocuments(query)
    ]);

    res.json({ blogs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/blogs/liked', async (req, res) => {
  try {
    const userId = extractUserId(req.headers.authorization);
    if (!userId) return res.status(401).json({ message: 'Unauthorized: Please log in to view liked blogs.' });

    const likedBlogs = await Blog.find({ likes: userId }).populate('author', 'name email avatar').sort({ createdAt: -1 });
    res.json({ blogs: likedBlogs });
  } catch (error) {
    console.error('Error fetching liked blogs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/blogs/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('author', 'name email avatar').populate('likes', 'name').populate({ path: 'comments.author', select: 'name avatar' });
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    // Increment views safely without triggering full validation
    await Blog.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true, runValidators: false });
    
    res.json({ blog });
  } catch (error) {
    console.error('Error in GET /api/blogs/:id:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/blogs', async (req, res) => {
  try {
    const authorId = extractUserId(req.headers.authorization);
    if (!authorId) return res.status(401).json({ message: 'Unauthorized' });

    const { title, subtitle, content, excerpt, tags, images, location, featured, published, readTime } = req.body;

    console.log('Received images array:', images);

    const blog = new Blog({
      title,
      subtitle,
      content,
      excerpt,
      author: authorId,
      tags: tags || [],
      images: images || [],
      location,
      featured: featured || false,
      published: published !== undefined ? published : true,
      readTime: readTime || 5,
      updatedAt: new Date()
    });
    await blog.save();
    await User.findByIdAndUpdate(authorId, { $inc: { storiesWritten: 1 } });
    const populatedBlog = await Blog.findById(blog._id).populate('author', 'name email');
    res.status(201).json({ message: 'Blog created successfully', blog: populatedBlog });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// New route to update a blog post
app.put('/api/blogs/:id', async (req, res) => {
  try {
    const authorId = extractUserId(req.headers.authorization);
    if (!authorId) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    const updates = req.body;

    const blog = await Blog.findOneAndUpdate(
      { _id: id, author: authorId },
      { $set: { ...updates, updatedAt: new Date() } },
      { new: true, runValidators: true }
    ).populate('author', 'name email');

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found or you are not the author' });
    }

    res.json({ message: 'Blog updated successfully', blog });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// New route to delete a blog post
app.delete('/api/blogs/:id', async (req, res) => {
  try {
    const authorId = extractUserId(req.headers.authorization);
    if (!authorId) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;

    const blog = await Blog.findOneAndDelete({ _id: id, author: authorId });

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found or you are not the author' });
    }

    await User.findByIdAndUpdate(authorId, { $inc: { storiesWritten: -1 } });

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// New route to like/unlike a blog post
app.post('/api/blogs/:id/like', async (req, res) => {
  try {
    const userId = extractUserId(req.headers.authorization);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    const index = blog.likes.indexOf(userId);
    if (index === -1) {
      blog.likes.push(userId);
    } else {
      blog.likes.splice(index, 1);
    }
    await blog.save();

    res.json({ message: 'Like status updated', likes: blog.likes });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// New route to add a comment to a blog post
app.post('/api/blogs/:id/comment', async (req, res) => {
  try {
    const userId = extractUserId(req.headers.authorization);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    const { content } = req.body;

    if (!content) return res.status(400).json({ message: 'Comment content is required' });

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    const comment = { author: userId, content };
    blog.comments.push(comment);
    await blog.save();

    const populatedComment = await Blog.findById(blog._id).populate({ path: 'comments.author', select: 'name avatar' });

    res.status(201).json({ message: 'Comment added', comment: populatedComment.comments[populatedComment.comments.length - 1] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// File upload route
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  console.log('Uploaded file:', req.file.filename);
  console.log('Generated URL:', `/uploads/${req.file.filename}`);
  res.json({ message: 'File uploaded successfully', url: `/uploads/${req.file.filename}`, filename: req.file.filename });
});

// Health check
app.get('/api/health', (req, res) => res.json({ message: 'Server is running', timestamp: new Date().toISOString() }));

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Start server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

module.exports = app;
