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
const compression = require('compression');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const helmet = require('helmet');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000||8080;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// Initialize Google OAuth2Client
const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '1h' });
};

// Middleware to protect routes and extract user
const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded.id;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:5000',
    process.env.VITE_BACKEND_URL
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../../public')));
// app.use(morgan('dev')); // Removed this line to prevent general request logging
// Re-enable helmet with specific configurations
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  frameguard: { action: 'SAMEORIGIN' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://accounts.google.com", "https://*.googleapis.com"],
      frameSrc: ["'self'", "https://accounts.google.com"],
      connectSrc: ["'self'", "https://accounts.google.com", "https://*.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://ssl.gstatic.com", "https://lh3.googleusercontent.com"],
      styleSrc: ["'self'", "https://accounts.google.com"],
    },
  },
}));
app.use(compression());

// Handle preflight requests
app.options('*', cors(corsOptions));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for development
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://dummyuser:dummypassword@cluster0.dummy.mongodb.net/wanderlust?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {})
.catch((error) => { console.error('MongoDB connection error:', error); }); // Kept error log

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
  country: { type: String, default: '' },
  countriesExplored: { type: Number, default: 0 },
  photosShared: { type: Number, default: 0 },
  storiesWritten: { type: Number, default: 0 },
  joinedAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
  isGoogleUser: { type: Boolean, default: false },
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
  country: { type: String },
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

    const token = generateToken(user._id);
    console.log(`User registered: ${user.name}`); // Log for new user registration
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

    const token = generateToken(user._id);
    console.log(`User logged in: ${user.name}`); // Log for successful login
    res.json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Google OAuth Login Route
app.post('/api/auth/google', async (req, res) => {
  const { code } = req.body; 
  
  try {
    // Exchange the authorization code for tokens (including id_token)
    const { tokens } = await client.getToken(code);
    
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token, // Use the id_token from the tokens response
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user if they don't exist
      user = new User({
        name: name,
        email: email,
        password: sub, // Use sub as a placeholder password for Google users
        avatar: picture,
        isGoogleUser: true,
      });
      await user.save();
      console.log(`New Google user logged in: ${user.name}`); // Log for new Google user
    } else if (!user.isGoogleUser) {
      // If a user with this email exists but isn't a Google user, prevent login
      return res.status(400).json({ message: 'Email already registered with traditional login. Please use traditional login.' });
    } else {
      console.log(`Existing Google user logged in: ${user.name}`); // Log for existing Google user
    }

    user.lastActive = new Date();
    await user.save();

    const token = generateToken(user._id);
    res.status(200).json({
      message: 'Google login successful',
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
      token,
    });

  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(500).json({ message: 'Google authentication failed', error: error.message });
  }
});

app.get('/api/auth/logout', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (user) {
      user.lastActive = new Date();
      await user.save();
      console.log(`User logged out: ${user.name}`); // Log for user logout
    }
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/auth/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user: { 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      avatar: user.avatar, 
      bio: user.bio, 
      country: user.country, 
      countriesExplored: user.countriesExplored, 
      photosShared: user.photosShared, 
      storiesWritten: user.storiesWritten, 
      joinedAt: user.joinedAt, 
      lastActive: user.lastActive, 
      isGoogleUser: user.isGoogleUser,
    } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update User Profile Route
app.put('/api/auth/update', protect, async (req, res) => {
  try {
    const userId = req.user; // User ID from protect middleware
    const { name, email, avatar, bio, country } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) {
      // Check if new email already exists for another user
      const existingUserWithEmail = await User.findOne({ email });
      if (existingUserWithEmail && existingUserWithEmail._id.toString() !== userId) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }
    if (avatar) user.avatar = avatar;
    if (bio) user.bio = bio;
    if (country) user.country = country;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, bio: user.bio, country: user.country }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete User Account Route
app.delete('/api/auth/delete', protect, async (req, res) => {
  try {
    const userId = req.user; // User ID from protect middleware

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user's blogs
    await Blog.deleteMany({ author: userId });

    // Delete user's comments from all blogs
    await Blog.updateMany(
      {}, 
      { $pull: { comments: { author: userId } } }
    );

    // Finally, delete the user account
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// User Stats Route
app.get('/api/user-stats', async (req, res) => {
  try {
    const [totalUsers, totalBlogs, uniqueCountries, totalImages] = await Promise.all([
      User.countDocuments(),
      Blog.countDocuments(),
      Blog.distinct('country'),
      Blog.aggregate([
        { $unwind: '$images' },
        { $count: 'total' }
      ]),
    ]);

    const photosShared = totalImages.length > 0 ? totalImages[0].total : 0;

    res.json({
      countriesExplored: uniqueCountries.length,
      photosShared: photosShared,
      storiesWritten: totalBlogs,
      communityMembers: totalUsers
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Blog Routes
app.get('/api/blogs', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (search) {
      const searchRegex = new RegExp(search, 'i'); // Case-insensitive search
      query = {
        $or: [
          { title: { $regex: searchRegex } },
          { subtitle: { $regex: searchRegex } },
          { content: { $regex: searchRegex } },
          { excerpt: { $regex: searchRegex } },
          { tags: { $regex: searchRegex } },
          { country: { $regex: searchRegex } },
        ],
      };
    }

    const blogs = await Blog.find(query)
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Blog.countDocuments(query);

    res.json({ blogs, total, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/blogs/liked', protect, async (req, res) => {
  try {
    const likedBlogs = await Blog.find({ likes: req.user }).populate('author', 'name avatar');
    res.json({ blogs: likedBlogs });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/blogs/my-stories', protect, async (req, res) => {
  if (!req.user) {
    return res.status(400).json({ message: 'User not authenticated or ID missing.' });
  }

  try {
    const myBlogs = await Blog.find({ author: req.user })
      .populate('author', 'name avatar')
      .populate('comments.author', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ blogs: myBlogs });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/blogs/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name avatar')
      .populate('comments.author', 'name avatar');
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    blog.views += 1; // Increment view count
    await blog.save();
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/blogs', protect, [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('excerpt').notEmpty().withMessage('Excerpt is required'),
  body('country').notEmpty().withMessage('Country is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, subtitle, content, excerpt, tags, locationName, locationLat, locationLng, featured, published, readTime, country, images } = req.body;
    const parsedTags = tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [];

    const blog = new Blog({
      title,
      subtitle,
      content,
      excerpt,
      author: req.user,
      tags: parsedTags,
      images: images || [],
      country,
      location: locationName ? { name: locationName, coordinates: { lat: locationLat, lng: locationLng } } : undefined,
      featured: featured,
      published: published,
      readTime: parseInt(readTime) || 5,
    });

    await blog.save();

    // Update user's storiesWritten count
    await User.findByIdAndUpdate(req.user, { $inc: { storiesWritten: 1 } });
    
    const user = await User.findById(req.user);
    console.log(`New blog created: "${blog.title}" by ${user ? user.name : 'Unknown User'}`); // Log for new blog creation

    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/blogs/:id', protect, [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('excerpt').notEmpty().withMessage('Excerpt is required'),
  body('country').notEmpty().withMessage('Country is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, subtitle, content, excerpt, tags, locationName, locationLat, locationLng, featured, published, readTime, images, country } = req.body;
    const parsedTags = tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [];

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    if (blog.author.toString() !== req.user) {
      return res.status(403).json({ message: 'Not authorized to update this blog' });
    }

    blog.title = title;
    blog.subtitle = subtitle;
    blog.content = content;
    blog.excerpt = excerpt;
    blog.tags = parsedTags;
    blog.images = images || [];
    blog.country = country;
    blog.location = locationName ? { name: locationName, coordinates: { lat: locationLat, lng: locationLng } } : undefined;
    blog.featured = featured;
    blog.published = published;
    blog.readTime = parseInt(readTime) || 5;
    blog.updatedAt = new Date();

    await blog.save();
    
    const user = await User.findById(req.user);
    console.log(`Blog updated: "${blog.title}" by ${user ? user.name : 'Unknown User'}`); // Log for blog update

    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/blogs/:id', protect, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    if (blog.author.toString() !== req.user) {
      return res.status(403).json({ message: 'Not authorized to delete this blog' });
    }

    // Delete associated images
    blog.images.forEach(imagePath => {
      const filePath = path.join(__dirname, imagePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    await blog.deleteOne();

    // Update user's storiesWritten count
    await User.findByIdAndUpdate(req.user, { $inc: { storiesWritten: -1 } });
    
    const user = await User.findById(req.user);
    console.log(`Blog deleted: "${blog.title}" by ${user ? user.name : 'Unknown User'}`); // Log for blog deletion

    res.json({ message: 'Blog removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/blogs/:id/like', protect, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    const userId = req.user;
    const isLiked = blog.likes.includes(userId);
    const user = await User.findById(req.user); // Get user for logging

    if (isLiked) {
      blog.likes = blog.likes.filter(id => id.toString() !== userId);
      console.log(`Blog unliked: "${blog.title}" by ${user ? user.name : 'Unknown User'}`); // Log for unliking
    } else {
      blog.likes.push(userId);
      console.log(`Blog liked: "${blog.title}" by ${user ? user.name : 'Unknown User'}`); // Log for liking
    }

    await blog.save();
    res.json({ message: 'Like status updated', likes: blog.likes });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/blogs/:id/comment', protect, async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    const { content } = req.body;

    if (!content) return res.status(400).json({ message: 'Comment content is required' });

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    const authorUser = await User.findById(userId).select('name avatar');
    if (!authorUser) return res.status(404).json({ message: 'Comment author not found' });

    const comment = {
      author: userId,
      content,
      createdAt: new Date()
    };
    blog.comments.push(comment);
    await blog.save();
    
    console.log(`Comment added to blog: "${blog.title}" by ${authorUser.name}`); // Log for comment added

    const returnedComment = {
      _id: blog.comments[blog.comments.length - 1]._id,
      author: {
        _id: authorUser._id,
        name: authorUser.name,
        avatar: authorUser.avatar
      },
      content,
      createdAt: comment.createdAt
    };

    res.status(201).json({ message: 'Comment added', comment: returnedComment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// app.post('/api/upload', upload.single('file'), (req, res) => {
//   if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
//   res.json({ message: 'File uploaded successfully', url: `/uploads/${req.file.filename}`, filename: req.file.filename });
// }); // Removed because it's not on the list of desired logs and can be noisy.

// app.get('/api/health', (req, res) => res.json({ message: 'Server is running', timestamp: new Date().toISOString() })); // Removed this as it's not on the list.

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err); // Kept for unhandled errors
  res.status(500).json({ message: 'Server error', error: err.message });
});

app.listen(PORT, () => {
    // console.log(`Server running on port ${PORT}`); // Removed this line
});

module.exports = app;
