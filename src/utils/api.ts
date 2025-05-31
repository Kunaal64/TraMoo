
// API Configuration for MongoDB Atlas integration
// This will contain all API calls and configurations

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

// Dummy credentials - replace with actual values
const MONGODB_CONFIG = {
  connectionString: 'mongodb+srv://dummyuser:dummypassword@cluster0.dummy.mongodb.net/wanderlust?retryWrites=true&w=majority',
  dbName: 'wanderlust',
  collections: {
    users: 'users',
    blogs: 'blogs',
    comments: 'comments',
    media: 'media'
  }
};

// API utility functions
class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: { name: string; email: string; password: string }) {
    return this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Blog methods
  async getBlogs(page: number = 1, limit: number = 10) {
    return this.request<{ blogs: any[]; total: number; page: number }>(`/blogs?page=${page}&limit=${limit}`);
  }

  async getBlogById(id: string) {
    return this.request<{ blog: any }>(`/blogs/${id}`);
  }

  async createBlog(blogData: any) {
    const token = localStorage.getItem('authToken');
    return this.request<{ blog: any }>('/blogs', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(blogData),
    });
  }

  async updateBlog(id: string, blogData: any) {
    const token = localStorage.getItem('authToken');
    return this.request<{ blog: any }>(`/blogs/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(blogData),
    });
  }

  async deleteBlog(id: string) {
    const token = localStorage.getItem('authToken');
    return this.request<{ message: string }>(`/blogs/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Media upload
  async uploadMedia(file: File) {
    const token = localStorage.getItem('authToken');
    const formData = new FormData();
    formData.append('file', file);

    return fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }).then(response => response.json());
  }
}

export const apiService = new ApiService();
export { MONGODB_CONFIG };
