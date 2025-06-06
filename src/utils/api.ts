// API Configuration for MongoDB Atlas integration
// This will contain all API calls and configurations

// Ensure the backend URL is properly formatted
const cleanBackendUrl = (url: string): string => {
  // Remove any trailing slashes and whitespace
  let cleanUrl = url.trim().replace(/\/+$/, '');
  // Remove /api if it's at the end to prevent double /api
  cleanUrl = cleanUrl.replace(/\/api$/, '');
  return cleanUrl + '/';
};

const API_BASE_URL = cleanBackendUrl(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000') + 'api';

// Dummy credentials - replace with actual values
const MONGODB_CONFIG = {
  connectionString: 'mongodb+srv://kunalsharmamva610:Kunal1064@tramoo.lbiwknp.mongodb.net/?retryWrites=true&w=majority&appName=TraMoo',
  dbName: 'wanderlust',
  collections: {
    users: 'users',
    blogs: 'blogs',
    comments: 'comments',
    media: 'media'
  }
};

import { BlogComment } from "./types";

// API utility functions
class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl || API_BASE_URL;
  }

  // Generic request method
  public async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    try {
      // Ensure endpoint starts with a slash
      const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const url = `${this.baseUrl}${normalizedEndpoint}`;
      
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');

      // Log request for debugging (removed)
      // console.log(`API Request [${options.method || 'GET'}] ${url}`, { 
      //   endpoint,
      //   options,
      //   retryCount 
      // });

      const config: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(options.headers || {}),
        },
        credentials: 'include' as RequestCredentials,
      };

      const response = await fetch(url, config);
      
      // Handle 401 Unauthorized
      if (response.status === 401) {
        // Try to refresh token if this is the first retry
        if (retryCount === 0) {
          try {
            const refreshResponse = await this.request<{ token: string; refreshToken: string }>('/auth/refresh', {
              method: 'POST',
              body: JSON.stringify({ refreshToken }),
              credentials: 'include',
            });
            
            if (refreshResponse.token && refreshResponse.refreshToken) {
              localStorage.setItem('token', refreshResponse.token);
              localStorage.setItem('refreshToken', refreshResponse.refreshToken);
              // Retry the original request with new token
              return this.request<T>(endpoint, options, retryCount + 1);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // Clear auth state and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            throw new Error('Session expired. Please log in again.');
          }
        }
        
        // If we already retried or refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
      }

      // Handle rate limiting (429)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '5';
        const retryDelay = parseInt(retryAfter, 10) * 1000 || 5000;
        
        if (retryCount < 3) {
          console.log(`Rate limited. Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return this.request<T>(endpoint, options, retryCount + 1);
        }
        
        throw new Error('Too many requests. Please try again later.');
      }

      // Handle other error statuses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `Request failed with status ${response.status}`;
        
        // Log detailed error for debugging
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          url,
          error: errorData,
        });
        
        throw new Error(errorMessage);
      }

      // Handle successful response (no logging needed here)
      const data = await response.json().catch(() => ({}));
      return data as T;
      
    } catch (error) {
      console.error('API Request Failed:', {
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount,
      });
      
      // Only retry on network errors
      if (error instanceof TypeError && error.message.includes('Failed to fetch') && retryCount < 2) {
        console.log(`Network error. Retrying (${retryCount + 1}/2)...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.request<T>(endpoint, options, retryCount + 1);
      }
      
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.request<{ user: any; token: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: { name: string; email: string; password: string }) {
    return this.request<{ user: any; token: string; refreshToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Chat methods
  async sendChatMessage(message: string, chatSessionId: string) {
    return this.request<{
      success: boolean;
      messages: Array<{
        type: 'user' | 'bot';
        text: string;
        timestamp: string;
      }>;
    }>('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message, chatSessionId }),
    });
  }

  async getChatHistory(chatSessionId: string) {
    return this.request<Array<{
      _id: string;
      chatSessionId: string;
      sender: 'user' | 'bot';
      message: string;
      timestamp: string;
    }>>(`/chat/history/${chatSessionId}`);
  }

  async clearChatHistory(chatSessionId: string) {
    return this.request(`/chat/history/${chatSessionId}`, {
      method: 'DELETE',
    });
  }

  // Blog methods
  async getBlogs(page: number = 1, limit: number = 10) {
    const response = await this.request<any>(`/blogs?page=${page}&limit=${limit}`);
    return Array.isArray(response.blogs) ? response.blogs : [];
  }

  async getAllBlogs(query?: string) {
    const response = await this.request<any>(`/blogs${query ? `?search=${encodeURIComponent(query)}` : ''}`);
    return Array.isArray(response.blogs) ? response.blogs : [];
  }

  async getBlogById(id: string) {
    return this.request<{ blog: any }>(`/blogs/${id}`);
  }

  async createBlog(blogData: any) {
    return this.request<{ blog: any }>('/blogs', {
      method: 'POST',
      body: JSON.stringify(blogData),
    });
  }

  async updateBlog(id: string, blogData: any) {
    return this.request<{ blog: any }>(`/blogs/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(blogData),
      }
    );
  }

  async likeBlog(id: string) {
    return this.request<{ likes: string[]; isLiked: boolean }>(`/blogs/${id}/like`, {
      method: 'POST',
    });
  }

  async deleteBlog(id: string) {
    return this.request<{ message: string }>(`/blogs/${id}`, {
      method: 'DELETE',
    });
  }

  async addComment(blogId: string, content: string) {
    return this.request<{ comment: BlogComment }>(`/blogs/${blogId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }
}

// Create a single instance of the API service
const apiService = new ApiService();

// Export the instance and config
export { apiService, MONGODB_CONFIG };

export default apiService;
