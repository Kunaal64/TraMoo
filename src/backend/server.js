console.log('Server.js file loaded at:', new Date().toISOString());
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
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

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
      console.log('Backend: Received token for protection:', token);
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded.id;
      console.log('Backend: Decoded user ID from token:', req.user);
      next();
    } catch (error) {
      console.error('Backend: Token verification failed:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    console.log('Backend: No token provided for protected route');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../../public')));
app.use(morgan('dev'));
app.use((req, res, next) => {
  console.log(`Backend: Incoming request: ${req.method} ${req.originalUrl}`);
  next();
});
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
  const { code } = req.body; // Expecting 'code' from frontend

  console.log('Received Google auth code:', code);

  try {
    // Exchange the authorization code for tokens
    const { tokens } = await client.getToken(code);
    console.log('Tokens received from Google:', tokens);

    const idToken = tokens.id_token;

    // Verify the idToken
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (user) {
      // User exists
      if (user.isGoogleUser) {
        // Existing Google user, just log them in
        user.avatar = picture || user.avatar;
        user.lastActive = new Date();
        await user.save();
      } else {
        // User exists but is NOT a Google user (registered traditionally)
        return res.status(409).json({
          message: 'This email is already registered. Please log in using your password, or link your Google account in your profile settings.',
          code: 'EMAIL_ALREADY_EXISTS_NON_GOOGLE'
        });
      }
    } else {
      // User does not exist, create new Google user
      user = new User({
        name: name || email,
        email,
        password: 'google_oauth_user_no_password', // Placeholder, user can't login with this
        avatar: picture || '',
        isGoogleUser: true,
      });
      await user.save();

      const appToken = generateToken(user._id);

      return res.status(201).json({
        message: 'Google login successful',
        user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
        token: appToken,
        code: 'NEW_GOOGLE_USER'
      });
    }

    const appToken = generateToken(user._id);

    // For existing Google users, send 200 OK
    res.status(200).json({
      message: 'Google login successful',
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
      token: appToken,
      code: 'EXISTING_GOOGLE_USER'
    });

  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(401).json({ message: 'Google authentication failed', error: error.message });
  }
});

app.get('/api/auth/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password');
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
    console.error('Backend: Error fetching blogs:', error);
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
  console.log('Backend: Entering /api/blogs/my-stories route.');
  console.log('Backend: User ID for my-stories route:', req.user);

  if (!req.user) {
    console.error('Backend: Error: User ID is undefined for /api/blogs/my-stories. This should not happen with protect middleware.');
    return res.status(400).json({ message: 'User not authenticated or ID missing.' });
  }

  try {
    const myBlogs = await Blog.find({ author: req.user }).populate('author', 'name avatar').sort({ createdAt: -1 });
    console.log(`Backend: Found ${myBlogs.length} blogs for user ${req.user}`);
    res.json({ blogs: myBlogs });
  } catch (error) {
    console.error('Backend: Error fetching my blogs (inside catch):', error.message);
    console.error('Backend: Error stack (inside catch):', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/blogs/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('author', 'name avatar');
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    blog.views += 1; // Increment view count
    await blog.save();
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/blogs', protect, upload.fields([{ name: 'images', maxCount: 10 }]), [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('excerpt').notEmpty().withMessage('Excerpt is required'),
  body('country').notEmpty().withMessage('Country is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.files && req.files.images && Array.isArray(req.files.images)) {
      req.files.images.forEach(file => fs.unlinkSync(file.path)); // Delete uploaded files on validation error
    }
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, subtitle, content, excerpt, tags, locationName, locationLat, locationLng, featured, published, readTime, country } = req.body;
    const images = (req.files && Array.isArray(req.files.images)) ? req.files.images.map(file => `/uploads/${file.filename}`) : [];
    const parsedTags = tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [];

    const blog = new Blog({
      title,
      subtitle,
      content,
      excerpt,
      author: req.user,
      tags: parsedTags,
      images,
      country,
      location: locationName ? { name: locationName, coordinates: { lat: locationLat, lng: locationLng } } : undefined,
      featured: featured === 'true',
      published: published === 'true',
      readTime: parseInt(readTime) || 5,
    });

    await blog.save();

    // Update user's storiesWritten count
    await User.findByIdAndUpdate(req.user, { $inc: { storiesWritten: 1 } });

    res.status(201).json(blog);
  } catch (error) {
    if (req.files && req.files.images && Array.isArray(req.files.images)) {
      req.files.images.forEach(file => fs.unlinkSync(file.path)); // Delete uploaded files on server error
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/blogs/:id', protect, upload.array('images', 5), [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('excerpt').notEmpty().withMessage('Excerpt is required'),
  body('country').notEmpty().withMessage('Country is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => fs.unlinkSync(file.path));
    }
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, subtitle, content, excerpt, tags, locationName, locationLat, locationLng, featured, published, readTime, existingImages, country } = req.body;
    const newImages = Array.isArray(req.files) ? req.files.map(file => `/uploads/${file.filename}`) : [];
    const parsedExistingImages = existingImages ? (Array.isArray(existingImages) ? existingImages : JSON.parse(existingImages)) : [];
    const updatedImages = parsedExistingImages.concat(newImages);
    const parsedTags = tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [];

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    if (blog.author.toString() !== req.user) {
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach(file => fs.unlinkSync(file.path));
      }
      return res.status(403).json({ message: 'Not authorized to update this blog' });
    }

    blog.title = title;
    blog.subtitle = subtitle;
    blog.content = content;
    blog.excerpt = excerpt;
    blog.tags = parsedTags;
    blog.images = updatedImages;
    blog.country = country;
    blog.location = locationName ? { name: locationName, coordinates: { lat: locationLat, lng: locationLng } } : undefined;
    blog.featured = featured === 'true';
    blog.published = published === 'true';
    blog.readTime = parseInt(readTime) || 5;
    blog.updatedAt = new Date();

    await blog.save();
    res.json(blog);
  } catch (error) {
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => fs.unlinkSync(file.path));
    }
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

    if (isLiked) {
      blog.likes = blog.likes.filter(id => id.toString() !== userId);
    } else {
      blog.likes.push(userId);
    }

    await blog.save();
    res.json({ message: 'Like status updated', likes: blog.likes });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/blogs/:id/comment', async (req, res) => {
  try {
    const userId = req.user;
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

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  console.log('Uploaded file:', req.file.filename);
  console.log('Generated URL:', `/uploads/${req.file.filename}`);
  res.json({ message: 'File uploaded successfully', url: `/uploads/${req.file.filename}`, filename: req.file.filename });
});

app.get('/api/health', (req, res) => res.json({ message: 'Server is running', timestamp: new Date().toISOString() }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Backend: Global Error Handler - Caught an error!');
  console.error('Backend: Global Error Handler - Stack:', err.stack);
  console.error('Backend: Global Error Handler - Message:', err.message);
  res.status(500).json({ message: 'Server error', error: err.message });
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

module.exports = app;
