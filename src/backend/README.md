
# Wanderlust Backend API

A Node.js/Express API for the Wanderlust travel blog application with MongoDB Atlas integration.

## Setup Instructions

### 1. Install Dependencies
```bash
cd src/backend
npm install
```

### 2. MongoDB Atlas Setup
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create a database user
4. Get your connection string
5. Replace the dummy connection string in `.env`

### 3. Environment Configuration
1. Copy `.env.example` to `.env`
2. Update all the configuration values:
   ```env
   MONGODB_URI=your-actual-mongodb-connection-string
   JWT_SECRET=your-secure-jwt-secret
   PORT=5000
   ```

### 4. Start the Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Blogs
- `GET /api/blogs` - Get all blogs (with pagination)
- `GET /api/blogs/:id` - Get single blog
- `POST /api/blogs` - Create new blog (auth required)
- `PUT /api/blogs/:id` - Update blog (auth required)
- `DELETE /api/blogs/:id` - Delete blog (auth required)

### File Upload
- `POST /api/upload` - Upload images/files

### Health Check
- `GET /api/health` - Server health status

## Database Schema

### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  avatar: String,
  bio: String,
  createdAt: Date
}
```

### Blogs Collection
```javascript
{
  title: String,
  content: String,
  excerpt: String,
  author: ObjectId (ref: User),
  tags: [String],
  images: [String],
  location: {
    name: String,
    coordinates: { lat: Number, lng: Number }
  },
  featured: Boolean,
  published: Boolean,
  views: Number,
  likes: [ObjectId] (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

## Dummy Data

The API includes dummy credentials for testing:
- Email: `demo@wanderlust.com`
- Password: `demo123`

## Security Notes

⚠️ **Important**: This is a development setup with dummy credentials. For production:

1. Use proper password hashing (bcryptjs)
2. Implement JWT authentication
3. Add input validation
4. Set up proper CORS
5. Use environment variables for all secrets
6. Add rate limiting
7. Implement proper error handling

## Frontend Integration

The frontend is configured to connect to this API. Make sure:
1. Backend server is running on port 5000
2. Frontend is running on port 5173
3. CORS is properly configured
