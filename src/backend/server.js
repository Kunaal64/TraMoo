// Backend Server Configuration for MongoDB Atlas
// This is a Node.js/Express server template

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
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
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust first proxy
app.set('trust proxy', 1);

// Make Google Generative AI optional
let GoogleGenerativeAI;
try {
  GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
  console.log('Google Generative AI initialized successfully');
} catch (error) {
  console.warn('Google Generative AI not available:', error.message);
  console.warn('AI features will be disabled');
}

// Simple in-memory cache
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

// Rate limiting configuration
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests
let lastRequestTime = 0;

// Rate limiter middleware
const rateLimiter = async (req, res, next) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const waitTime = RATE_LIMIT_DELAY - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
  next();
};

// Cache middleware
const cacheMiddleware = (req, res, next) => {
  const key = req.originalUrl;
  const cachedResponse = responseCache.get(key);
  if (cachedResponse) {
    res.setHeader('X-Cache', 'HIT');
    res.send(cachedResponse);
    return;
  }
  res.sendResponse = res.send;
  res.send = (body) => {
    responseCache.set(key, body);
    res.sendResponse(body);
  };
  next();
};
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// Temporarily log the VITE_FRONTEND_URL to debug CORS issue
console.log('Backend VITE_FRONTEND_URL:', process.env.VITE_FRONTEND_URL);

// Validate required environment variables
const requiredEnvVars = ['GEMINI_API_KEY', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Initialize Gemini API with configuration
const API_KEY = process.env.GEMINI_API_KEY;
const API_VERSION = 'v1'; // Using v1 API for better stability
const MODEL_ID = 'gemini-1.5-pro-latest'; // Using the standard model for better compatibility

let genAI;
try {
  genAI = new GoogleGenerativeAI(API_KEY, {
    // The SDK will use the latest stable version by default
  });
} catch (error) {
  console.error('Failed to initialize Gemini API:', error);
  process.exit(1);
}

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
    'http://localhost:8081',
    process.env.VITE_BACKEND_URL,
    process.env.VITE_FRONTEND_URL
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
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
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Use the client's IP address, considering the X-Forwarded-For header
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  }
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

// Schemas
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
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

const ChatMessageSchema = new mongoose.Schema({
  chatSessionId: { type: String, required: true, index: true }, // To group messages by session
  sender: { type: String, required: true }, // 'user' or 'bot'
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }, // Changed back to Date type
});

const User = mongoose.model('User', UserSchema);
const Blog = mongoose.model('Blog', BlogSchema);
const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);

// Routes

// Auth Routes
app.post('/api/auth/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    const token = generateToken(user.id);
    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email }, token });
    console.log(`New user registered: ${user.name} (${user.email})`);
  } catch (error) {
    console.error(error); // Keep this error log
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const token = generateToken(user.id);
    res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
    console.log(`Existing user logged in: ${user.name} (${user.email})`);
  } catch (error) {
    console.error(error); // Keep this error log
    res.status(500).json({ message: 'Server error' });
  }
});

// Google OAuth Login Route
app.post('/api/auth/google', async (req, res) => {
  const { code } = req.body;

  try {
    const { tokens } = await client.getToken(code);
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    let user = await User.findOne({ email: payload.email });

    if (!user) {
      // Create new user if not exists
      user = new User({
        name: payload.name,
        email: payload.email,
        password: Date.now().toString(), // Dummy password for Google users
        isGoogleUser: true,
      });
      await user.save();
    } else if (!user.isGoogleUser) {
      // If a user with this email exists but is not a Google user, return an error
      return res.status(409).json({ message: 'An account with this email already exists. Please sign in using your password.', code: 'EMAIL_ALREADY_EXISTS_NON_GOOGLE' });
    }

    const token = generateToken(user.id);
    res.status(200).json({ user: { id: user.id, name: user.name, email: user.email }, token });
    console.log(`Google user logged in: ${user.name} (${user.email})`);
  } catch (error) {
    console.error('Google authentication error:', error); // Keep this error log
    res.status(500).json({ message: 'Google authentication failed' });
  }
});

app.get('/api/auth/logout', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // In a real application, you might invalidate the token on the server-side
    // For JWTs, this often means relying on client-side token deletion and expiration.
    res.status(200).json({ message: 'Logged out successfully' });
    console.log(`User logged out: ${user.name} (${user.email})`);
  } catch (error) {
    console.error(error); // Keep this error log
    res.status(500).json({ message: 'Server error during logout' });
  }
});

app.get('/api/auth/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error); // Keep this error log
    res.status(500).json({ message: 'Server error' });
  }
});

// Update User Profile Route
app.put('/api/auth/update', protect, async (req, res) => {
  try {
    const userId = req.user;
    const { name, email, country, bio, currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update basic profile info
    user.name = name || user.name;
    user.email = email || user.email;
    user.country = country || user.country;
    user.bio = bio || user.bio;

    // Handle password change if newPassword is provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change password.' });
      }
      // Check if user is a Google user and disallow password change
      if (user.isGoogleUser) {
        return res.status(400).json({ message: 'Google users cannot change password directly.' });
      }
      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid current password.' });
      }

      // Hash new password and save
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: { id: user._id, name: user.name, email: user.email, bio: user.bio, country: user.country }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify Current Password Route
app.post('/api/auth/verify-current-password', protect, async (req, res) => {
  try {
    const userId = req.user;
    const { currentPassword } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isGoogleUser) {
      return res.status(400).json({ message: 'Google users do not have a traditional password.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid current password.' });
    }

    res.status(200).json({ message: 'Current password verified successfully.' });
  } catch (error) {
    console.error('Error verifying current password:', error);
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

    const blogSaved = await blog.save();

    // Populate author and return
    const populatedBlog = await Blog.findById(blogSaved._id).populate('author', 'name');
    res.status(201).json(populatedBlog);
    const user = await User.findById(req.user);
    console.log(`New blog created: "${blog.title}" by ${user ? user.name : 'Unknown User'}`);
  } catch (error) {
    console.error(error); // Keep this error log
    res.status(500).json({ message: 'Server error' });
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

  const { title, subtitle, content, excerpt, tags, country, published } = req.body;
  const newImages = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

  try {
    let blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Ensure author matches
    if (blog.author.toString() !== req.user) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Combine existing and new images
    const currentImages = blog.images;
    const updatedImages = Array.isArray(currentImages) ? [...currentImages, ...newImages] : newImages;

    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, {
      title,
      subtitle,
      content,
      excerpt: excerpt || content.substring(0, 150) + '...',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      images: updatedImages,
      country,
      published: published === 'true',
      updatedAt: Date.now()
    }, { new: true });

    res.json(updatedBlog);
    const user = await User.findById(req.user);
    const action = updatedBlog.published ? 'edited' : 'draft saved';
    console.log(`Blog ${action}: "${updatedBlog.title}" by ${user ? user.name : 'Unknown User'}`);
  } catch (error) {
    console.error(error); // Keep this error log
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/blogs/:id', protect, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (blog.author.toString() !== req.user) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Delete associated images from the file system
    blog.images.forEach(imagePath => {
      const filePath = path.join(__dirname, 'uploads', path.basename(imagePath));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    await Blog.findByIdAndDelete(req.params.id);

    res.json({ message: 'Blog removed' });
    const user = await User.findById(req.user);
    console.log(`Blog deleted: "${blog.title}" by ${user ? user.name : 'Unknown User'}`);
  } catch (error) {
    console.error(error); // Keep this error log
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/blogs/:id/like', protect, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const userId = req.user;
    const isLiked = blog.likes.includes(userId);

    if (isLiked) {
      blog.likes = blog.likes.filter(id => id.toString() !== userId.toString());
    } else {
      blog.likes.push(userId);
    }

    await blog.save();
    res.json({ likes: blog.likes.length, isLiked: !isLiked });
    const user = await User.findById(req.user);
    const action = isLiked ? 'unliked' : 'liked';
    console.log(`Blog ${action}: "${blog.title}" by ${user ? user.name : 'Unknown User'}`);
  } catch (error) {
    console.error(error); // Keep this error log
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/blogs/:id/comment', protect, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { content } = req.body;

  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const authorUser = await User.findById(req.user);
    if (!authorUser) {
      return res.status(404).json({ message: 'Author not found' });
    }

    const newComment = {
      author: req.user,
      content,
      createdAt: new Date()
    };

    blog.comments.push(newComment);
    await blog.save();

    // Populate the author field in the new comment to send back to frontend
    const populatedComment = blog.comments[blog.comments.length - 1];
    await ChatMessage.populate(populatedComment, { path: 'author', select: 'name' });

    res.status(201).json(populatedComment);
    const user = await User.findById(req.user);
    console.log(`Comment added to blog: "${blog.title}" by ${user ? user.name : 'Unknown User'}`);
  } catch (error) {
    console.error(error); // Keep this error log
    res.status(500).json({ message: 'Server error' });
  }
});

// Chatbot API Endpoints
app.get('/api/chat/history/:chatSessionId', protect, cacheMiddleware, async (req, res) => {
  const { chatSessionId } = req.params;
  const userId = req.user;

  if (!chatSessionId) {
    return res.status(400).json({ success: false, message: 'chatSessionId is required' });
  }

  try {
    let messages = await ChatMessage.find({ chatSessionId }).sort({ timestamp: 1 });

    // If no messages and it's a new session, send a welcome message from the bot
    if (messages.length === 0) {
      const welcomeMessageText = "Hello there! I'm your travel assistant. How can I help you plan your next adventure?";
      const newWelcomeMessage = new ChatMessage({
        chatSessionId,
        sender: 'bot',
        message: welcomeMessageText,
        timestamp: new Date(),
      });
      await newWelcomeMessage.save();
      messages = [newWelcomeMessage]; // Set messages to contain only the welcome message
    }

    // Format the response to match expected frontend format
    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      sender: msg.sender,
      message: msg.message,
      timestamp: msg.timestamp.toISOString()
    }));
    
    res.json(formattedMessages);
    const user = await User.findById(req.user);
    console.log(`Chat with chatbot initialized for user: ${user ? user.name : 'Unknown User'}`);
  } catch (error) {
    console.error('Error fetching chat history:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch chat history',
      error: error.message 
    });
  }
});

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

app.post('/api/chat/message', protect, rateLimiter, cacheMiddleware, async (req, res) => {
  const { message, chatSessionId } = req.body;
  const userId = req.user; // User ID from authenticated request

  if (!message || !chatSessionId) {
    return res.status(400).json({ success: false, message: 'Message and chatSessionId are required' });
  }

  try {
    // Save user message to DB
    const userMessage = new ChatMessage({
      chatSessionId,
      sender: 'user',
      message,
      timestamp: new Date(),
      userId, // Store userId for user messages
    });
    await userMessage.save();

    // Fetch recent chat history for context (last 5 messages excluding current one)
    const chatHistory = await ChatMessage.find({ chatSessionId })
      .sort({ timestamp: 1 })
      .limit(5); // Limit to last 5 messages for context

    const formattedHistory = chatHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.message }],
    }));

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    let attempt = 0;
    const maxAttempts = 3;
    let geminiResponseText = 'Sorry, I am having trouble connecting right now. Please try again later.';

    while (attempt < maxAttempts) {
      try {
        const result = await model.startChat({
          history: formattedHistory,
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
          },
        }).sendMessage(message);

        geminiResponseText = result.response.text();
        break; // Exit loop if successful
      } catch (geminiError) {
        console.error(`Gemini API Error on attempt ${attempt + 1}:`, geminiError);
        attempt++;
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        }
      }
    }

    // Save bot message to DB
    const botMessage = new ChatMessage({
      chatSessionId,
      sender: 'bot',
      message: geminiResponseText,
      timestamp: new Date(),
    });
    await botMessage.save();

    res.status(200).json({ success: true, messages: [userMessage, botMessage] });
    console.log(`Chatbot message sent for session: ${chatSessionId}`);
  } catch (error) {
    console.error('Error sending message to Gemini or saving chat:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ success: false, message: 'Failed to send message or save chat' });
  }
});

app.delete('/api/chat/history/:chatSessionId', protect, async (req, res) => {
  const { chatSessionId } = req.params;

  if (!chatSessionId) {
    return res.status(400).json({ success: false, message: 'chatSessionId is required' });
  }

  try {
    await ChatMessage.deleteMany({ chatSessionId });
    responseCache.del(req.originalUrl); // Invalidate cache for this session
    res.status(200).json({ success: true, message: 'Chat history cleared successfully' });
    const user = await User.findById(req.user);
    console.log(`Chat history deleted for user: ${user ? user.name : 'Unknown User'} (Session: ${chatSessionId})`);
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({ success: false, message: 'Failed to clear chat history' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err); // Kept for unhandled errors
  res.status(500).json({ message: 'Server error', error: err.message });
});

app.listen(PORT, () => {
});

module.exports = app;
