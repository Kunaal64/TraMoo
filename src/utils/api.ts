// API Configuration for MongoDB Atlas integration
// This will contain all API calls and configurations

// Ensure the backend URL ends with a single slash
const cleanBackendUrl = (url: string): string => {
  // Remove any trailing slashes and whitespace
  const cleanUrl = url.trim().replace(/\/+$/, '');
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

// API utility functions
class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl || API_BASE_URL;
    console.log('API Base URL:', this.baseUrl);
  }

  // Generic request method
  public async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Ensure endpoint starts with a slash
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${normalizedEndpoint}`;
    
    console.log(`[API] ${options.method || 'GET'} ${url}`);
    
    const token = localStorage.getItem('token'); // Get token from localStorage
    // console.log('[API] Token being sent:', token); // Removed debugging log

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }), // Add token if available
        ...options.headers,
      },
      ...options,
    };

    // console.log('[API] Request config headers:', config.headers); // Removed debugging log

    try {
      const response = await fetch(url, config);
      const responseData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        const errorMessage = responseData.message || `HTTP error! status: ${response.status}`;
        console.error(`[API Error] ${response.status} ${response.statusText}:`, errorMessage);
        throw new Error(errorMessage);
      }
      
      return responseData;
    } catch (error) {
      console.error('[API Request Failed]', {
        url,
        method: options.method || 'GET',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
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
    const response = await this.request<any>(`/blogs?page=${page}&limit=${limit}`);
    return Array.isArray(response.blogs) ? response.blogs : [];
  }

  async getAllBlogs() {
    const response = await this.request<any>('/blogs');
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
    return this.request<{ likes: number }>(`/blogs/${id}/like`, {
      method: 'POST',
    });
  }

  async deleteBlog(id: string) {
    return this.request<{ message: string }>(`/blogs/${id}`, {
      method: 'DELETE',
    });
  }

  // Media upload
  async uploadMedia(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token'); // Retrieve token for media upload

    return fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }), // Add token if available
      },
      body: formData,
    }).then(response => response.json());
  }
}

// Create a single instance of the API service
const apiService = new ApiService();

// Export the instance and config
export { apiService, MONGODB_CONFIG };

export default apiService;
