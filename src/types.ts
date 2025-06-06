export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  country?: string;
  countriesExplored?: number;
  photosShared?: number;
  storiesWritten?: number;
  joinedAt?: string;
  lastActive?: string;
  isGoogleUser?: boolean;
}

export interface BlogComment {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

export interface Author {
  _id: string;
  name: string;
  avatar?: string;
}

export interface Blog {
  _id: string;
  title: string;
  subtitle: string;
  content: string;
  excerpt: string;
  tags: string[];
  images: string[];
  published: boolean;
  country: string;
  likes: string[]; // Array of user IDs who liked the blog
  comments: BlogComment[]; // Array of comment objects
  author: Author; // Author object
  createdAt: string;
  updatedAt: string;
  readTime?: number;
} 