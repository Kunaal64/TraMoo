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

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust first proxy
app.set('trust proxy', 1);

// Make Google Generative AI optional
let GoogleGenerativeAI;
try {
  const { GoogleGenerativeAI: GoogleAI } = require('@google/generative-ai');
  GoogleGenerativeAI = GoogleAI;
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

// Initialize Google OAuth2 client
if (!process.env.GOOGLE_CLIENT_ID) {
  console.error('GOOGLE_CLIENT_ID is not set in environment variables');
  process.exit(1);
}

const client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'postmessage' // Default to postmessage for token exchange
});

console.log('Google OAuth client initialized.');

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

// CORS configuration
const allowedOrigins = [
  // Production
  'https://story-pin-voyage.vercel.app',
  'https://*.vercel.app',
  'https://wanderlust-3j9m.onrender.com',
  // Development
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:5000',
  'http://localhost:8081',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5000',
  // Add any other domains as needed
];

// Add any additional origins from environment variables
const frontendUrl = process.env.VITE_FRONTEND_URL || 'http://localhost:8080';
if (frontendUrl) {
  try {
    const url = new URL(frontendUrl);
    if (!allowedOrigins.includes(url.origin)) {
      allowedOrigins.push(url.origin);
    }
  } catch (e) {
    console.error('Invalid VITE_FRONTEND_URL:', e.message);
  }
}

console.log('Allowed CORS origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if the origin is in the allowed list
    const isAllowed = allowedOrigins.some(allowed => {
      return origin === allowed || 
             origin.startsWith(allowed.replace(/\/+$/, ''));
    });
    
    if (isAllowed) {
      return callback(null, true);
    } else {
      return callback(new Error(`Not allowed by CORS. Origin: ${origin}, Allowed: ${allowedOrigins.join(', ')}`), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Allow-Headers'],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: true
};
// CORS middleware with enhanced logging and handling
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const requestHeaders = req.headers['access-control-request-headers'];
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    
    // Check if origin is allowed
    if (origin && !allowedOrigins.some(o => origin === o || origin.startsWith(o.replace(/\/+$/, '')))) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not allowed by CORS',
        allowedOrigins: allowedOrigins 
      });
    }
    
    // Set preflight response headers
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', requestHeaders || 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    
    return res.status(204).send();
  }
  
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) {
    return next();
  }
  
  // Set CORS headers for actual requests
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.vary('Origin');
  
  // Add security headers
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  
  next();
});

// Other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../../public')));
// app.use(morgan('dev')); // Removed this line to prevent general request logging
// Re-enable helmet with specific configurations
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
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
  refreshToken: { type: String },
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
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Add userId
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
    const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email }, token, refreshToken });
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
    const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    user.refreshToken = refreshToken;
    await user.save();

    res.json({ user: { id: user.id, name: user.name, email: user.email }, token, refreshToken });
    console.log(`Existing user logged in: ${user.name} (${user.email})`);
  } catch (error) {
    console.error(error); // Keep this error log
    res.status(500).json({ message: 'Server error' });
  }
});

// Google OAuth Login Route
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;

  console.log('Google auth request received:', { 
    hasCredential: !!credential,
    credentialLength: credential ? credential.length : 0
  });

  if (!credential) {
    console.error('No credential provided in request body');
    return res.status(400).json({ 
      success: false, 
      message: 'Google credential is required',
      code: 'MISSING_CREDENTIAL'
    });
  }
  
  // Log the first 50 chars of the credential for debugging (don't log the whole thing for security)
  console.log('Credential received (first 50 chars):', credential.substring(0, 50) + '...');

  try {
    console.log('Verifying Google ID token with client ID:', process.env.GOOGLE_CLIENT_ID);
    
    // Verify the ID token from the credential
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    }).catch(error => {
      console.error('Error verifying Google ID token:', error.message);
      console.error('Full error object:', error);
      throw new Error('Invalid Google credential');
    });

    // Get the user's Google profile
    const payload = ticket.getPayload();
    
    if (!payload) {
      console.error('No payload received from Google');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Google credential',
        code: 'INVALID_CREDENTIAL'
      });
    }
    
    if (!payload.email) {
      console.error('No email found in Google account payload', payload);
      return res.status(400).json({ 
        success: false, 
        message: 'No email found in Google account',
        code: 'NO_EMAIL_IN_PROFILE'
      });
    }
    
    console.log('Google auth successful for email:', payload.email);
    console.log('Google user details:', {
      name: payload.name,
      email: payload.email,
      email_verified: payload.email_verified,
      picture: payload.picture ? 'has picture' : 'no picture'
    });

    // Find or create user in a transaction to prevent race conditions
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      console.log('Searching for user with email:', payload.email);
      let user = await User.findOne({ email: payload.email }).session(session);
      let isNewUser = false;
      
      if (!user) {
        console.log('User not found, creating new user.');
        // Create new user
        user = new User({
          name: payload.name || payload.email.split('@')[0],
          email: payload.email,
          password: crypto.randomBytes(20).toString('hex'), // Random password for Google users
          isGoogleUser: true,
          profilePicture: payload.picture,
          emailVerified: payload.email_verified || false,
          refreshToken: jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' }),
        });
        
        await user.save({ session });
        isNewUser = true;
        console.log('New user created for Google login:', user.email);
      } else if (!user.isGoogleUser) {
        console.warn('User found but not a Google user. Aborting transaction.');
        // User exists but not as Google user
        await session.abortTransaction();
        session.endSession();
        
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists. Please sign in using your password.',
          code: 'EMAIL_EXISTS_WITH_PASSWORD'
        });
      }
      
      // Generate JWT token
      console.log('Generating JWT for user ID:', user._id);
      const token = generateToken(user._id);
      const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
      user.refreshToken = refreshToken;
      await user.save({ session });

      // Prepare user data for response
      const userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        isGoogleUser: user.isGoogleUser,
        profilePicture: user.profilePicture,
        emailVerified: user.emailVerified
      };

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
      
      console.log('Sending success response for user:', userData.email);
      console.log(isNewUser ? 'New user registered' : 'Existing user logged in');

      // Return user data and token in the format expected by the frontend
      return res.status(200).json({
        success: true,
        token,
        user: userData,
        isNewUser,
        refreshToken
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error('Error in Google auth transaction:', error);
      console.error('Full transaction error object:', error);
      throw error; // Re-throw to be caught by the outer try-catch for consistent error response
    }
  } catch (error) {
    console.error('Google authentication error:', error);
    console.error('Full authentication error object:', error);
    
    let errorMessage = 'Google authentication failed';
    let statusCode = 500;
    let errorCode = 'AUTH_ERROR';
    
    if (error.message.includes('Invalid token') || error.message.includes('Invalid Google credential')) {
      errorMessage = 'Invalid Google token';
      statusCode = 400;
      errorCode = 'INVALID_TOKEN';
    } else if (error.message.includes('Token used too late')) {
      errorMessage = 'Expired Google token';
      statusCode = 400;
      errorCode = 'TOKEN_EXPIRED';
    } else if (error.message.includes('No credential provided')) {
      errorMessage = 'No Google credential provided';
      statusCode = 400;
      errorCode = 'MISSING_CREDENTIAL';
    } else if (error.message.includes('No email found')) {
      errorMessage = 'No email found in Google profile';
      statusCode = 400;
      errorCode = 'NO_EMAIL_IN_PROFILE';
    } else if (error.code === 11000) {
      // MongoDB duplicate key error (email already exists)
      errorMessage = 'An account with this email already exists';
      statusCode = 409;
      errorCode = 'DUPLICATE_EMAIL';
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      code: errorCode,
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        stack: error.stack
      })
    });
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
    console.log('Received request for /api/auth/me. User ID from token:', req.user);
    const user = await User.findById(req.user).select('-password');
    if (!user) {
      console.log('User not found for ID:', req.user);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Successfully fetched user for /api/auth/me:', user.email);
    res.json({ user }); // Wrap the user object in a 'user' key
  } catch (error) {
    console.error('Error in /api/auth/me:', error); // Keep this error log
    res.status(500).json({ message: 'Server error', error: error.message });
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
    res.json({ likes: blog.likes, isLiked: !isLiked });
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
    await Blog.populate(populatedComment, { path: 'author', select: 'name' });

    res.status(201).json(populatedComment);
    const user = await User.findById(req.user);
    console.log(`Comment added to blog: "${blog.title}" by ${user ? user.name : 'Unknown User'}`);
  } catch (error) {
    console.error(error); // Keep this error log
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/blogs/:id/comments/:commentId', protect, async (req, res) => {
  try {
    const blogId = req.params.id;
    const commentId = req.params.commentId;
    const userId = req.user; // User ID from protect middleware

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const comment = blog.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if the authenticated user is the author of the comment
    if (comment.author.toString() !== userId) {
      return res.status(401).json({ message: 'User not authorized to delete this comment' });
    }

    // Use pull to remove the subdocument from the array
    blog.comments.pull({ _id: commentId }); 
    await blog.save();

    res.status(200).json({ message: 'Comment deleted successfully' });
    const user = await User.findById(req.user);
    console.log(`Comment deleted from blog: "${blog.title}" by ${user ? user.name : 'Unknown User'}`);
  } catch (error) {
    console.error(error); // Keep this error log
    res.status(500).json({ message: 'Server error', error: error.message });
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
    // Fetch messages for the specific chatSessionId and userId
    let messages = await ChatMessage.find({ chatSessionId, userId }).sort({ timestamp: 1 });

    // If no messages and it's a new session, send a welcome message from the bot
    if (messages.length === 0) {
      const welcomeMessageText = "Hello there! I'm your travel assistant. How can I help you plan your next adventure?";
      const newWelcomeMessage = new ChatMessage({
        chatSessionId,
        sender: 'bot',
        message: welcomeMessageText,
        timestamp: new Date(),
        userId, // Associate welcome message with userId
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

    // Check if Google AI is available
    if (!GoogleGenerativeAI) {
      // Save a default response since AI is not available
      const botMessage = new ChatMessage({
        chatSessionId,
        sender: 'bot',
        message: 'AI features are currently unavailable. Please try again later or contact support.',
        timestamp: new Date(),
        userId,
      });
      await botMessage.save();
      
      return res.status(200).json({
        success: true,
        message: 'AI features are currently unavailable',
        response: botMessage
      });
    }

    // Check if Google AI API key is configured
    const googleApiKey = process.env.GEMINI_API_KEY;
    let geminiResponseText = 'I appreciate your message! Currently, I\'m experiencing high demand or technical difficulties. Please try again later or contact support if the issue persists.';

    if (googleApiKey) {
      try {
        const genAI = new GoogleGenerativeAI(googleApiKey);
        
        // Simple rate limiting - only process one request at a time
        const currentTime = Date.now();
        const lastRequestTime = global.lastGeminiRequestTime || 0;
        const timeSinceLastRequest = currentTime - lastRequestTime;
        
        // Enforce minimum 2 seconds between requests to avoid rate limiting
        if (timeSinceLastRequest < 2000) {
          await new Promise(resolve => setTimeout(resolve, 2000 - timeSinceLastRequest));
        }
        
        global.lastGeminiRequestTime = Date.now();
        
        // Fetch recent chat history for context (last 3 messages to reduce tokens)
        const chatHistory = await ChatMessage.find({ chatSessionId })
          .sort({ timestamp: -1 }) // Get most recent first
          .limit(3)
          .sort({ timestamp: 1 }); // Then sort back to chronological order

        // Format history for Gemini API
        const formattedHistory = chatHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.message }],
        }));

        // Use the stable Gemini Pro model
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-pro-latest",
          generationConfig: {
            maxOutputTokens: 300, // Reduce token usage
            temperature: 0.7,
          },
        });

        const result = await model.generateContent({
          contents: [
            ...formattedHistory,
            { 
              role: 'user', 
              parts: [{ 
                text: `(Please keep your response under 150 words) ${message}`
              }]
            }
          ]
        });
        
        const response = await result.response;
        geminiResponseText = response.text();
        
      } catch (error) {
        console.error('Error generating AI response:', error);
        // Use the default response if there's an error
      }
    }
    
    // Save bot message to DB
    const botMessage = new ChatMessage({
      chatSessionId,
      sender: 'bot',
      message: geminiResponseText,
      timestamp: new Date(),
      userId,
    });
    
    try {
      await botMessage.save();
      
      return res.status(200).json({
        success: true,
        message: 'Message processed successfully',
        response: botMessage
      });
      
    } catch (error) {
      console.error('Error saving bot message:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to save chat message',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    // If we get here, it's an unexpected error - send a generic error response
    const errorMessage = 'I\'m sorry, but I encountered an error while processing your message. Please try again later.';
    
    // Save error message to DB
    const botMessage = new ChatMessage({
      chatSessionId,
      sender: 'bot',
      message: errorMessage,
      timestamp: new Date(),
      userId,
    });
    
    try {
      await botMessage.save();
      
      return res.status(500).json({
        success: false,
        message: 'Failed to process chat message',
        response: botMessage,
        error: error.message
      });
    } catch (saveError) {
      console.error('Failed to save error message:', saveError);
      return res.status(500).json({
        success: false,
        message: 'Failed to process chat message',
        error: error.message
      });
    }
  }
});

app.delete('/api/chat/history/:chatSessionId', protect, async (req, res) => {
  const { chatSessionId } = req.params;
  const userId = req.user; // Get userId from protect middleware

  console.log(`Attempting to clear chat history for session: ${chatSessionId} by user: ${userId}`);

  if (!chatSessionId) {
    return res.status(400).json({ success: false, message: 'chatSessionId is required' });
  }

  try {
    // Ensure that only the owner of the chat session can delete it
    const deleteResult = await ChatMessage.deleteMany({ chatSessionId, userId });
    console.log(`Delete operation result for session ${chatSessionId}:`, deleteResult);

    if (deleteResult.deletedCount === 0) {
      console.warn(`No chat messages found or deleted for session: ${chatSessionId} for user: ${userId}.`);
    }

    responseCache.delete(req.originalUrl); // Invalidate cache for this session
    res.status(200).json({ success: true, message: 'Chat history cleared successfully' });
    const user = await User.findById(req.user);
    console.log(`Chat history deleted for user: ${user ? user.name : 'Unknown User'} (Session: ${chatSessionId})`);
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({ success: false, message: 'Failed to clear chat history' });
  }
});

// Token Refresh Route
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh Token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: 'Invalid Refresh Token' });
    }

    // Generate new access token
    const newAccessToken = generateToken(user._id);

    // Generate new refresh token for rotation (optional, but good practice)
    const newRefreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({ token: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(403).json({ message: 'Invalid or expired Refresh Token' });
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
