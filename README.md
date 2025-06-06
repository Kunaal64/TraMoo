# TraMoo - Travel Memories Blog

TraMoo is a full-stack MERN (MongoDB, Express.js, React, Node.js) application for travelers to share and discover travel stories. It includes user authentication, AI chatbot integration, and responsive design.

## ✨ Features

- User Authentication (Email/Password & Google OAuth)
- Create, Edit, Delete Travel Blogs with images
- Like & Comment on Posts
- Responsive Design with Tailwind CSS
- AI Chatbot (Gemini API)
- Featured Stories & Favourites Page
- User Profiles
- Dynamic Blog Search
- Animated Text Effects

## 🚀 Technologies Used

**Frontend:** React.js, TypeScript, Tailwind CSS, Framer Motion, React Router DOM, @react-oauth/google, Axios

**Backend:** Node.js, Express.js, MongoDB (Mongoose), bcryptjs, jsonwebtoken, google-auth-library, @google/generative-ai, Multer, express-validator, cors, compression, helmet, express-rate-limit

**Database:** MongoDB Atlas

## 🏁 Getting Started (Local Development)

### Prerequisites

- Node.js & npm/Yarn
- MongoDB Atlas account
- Google Cloud Project (for OAuth)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Kunaal64/story-pin-voyage-main.git
    cd story-pin-voyage-main
    ```

2.  **Backend Setup (`src/backend`):**

    ```bash
    cd src/backend
    npm install
    ```

    Create `.env`:

    ```env
    MONGODB_URI="your_mongodb_atlas_connection_string"
    JWT_SECRET="a_very_secret_key"
    GEMINI_API_KEY="your_gemini_api_key"
    GOOGLE_CLIENT_ID="your_google_client_id"
    GOOGLE_CLIENT_SECRET="your_google_client_secret"
    GOOGLE_REDIRECT_URI="http://localhost:5000/api/auth/google"
    VITE_FRONTEND_URL="http://localhost:5173"
    ```

    Start: `npm start`

3.  **Frontend Setup (`src/`):**
    ```bash
    cd ../ # from src/backend, or cd src from project root
    npm install
    ```
    Create `.env.local`:
    ```env
    VITE_BACKEND_URL="http://localhost:5000"
    ```
    Start: `npm run dev`

## ⚙️ Deployment

### Frontend (Vercel)

1.  Connect GitHub repo to [vercel.com](https://vercel.com/)
2.  Set **Root Directory** to `src/`.
3.  Add `VITE_BACKEND_URL` environment variable: `YOUR_RENDER_BACKEND_URL`
4.  Deploy.

### Backend (Render)

1.  Connect GitHub repo to [render.com](https://render.com/)
2.  Set **Root Directory** to `src/backend`.
3.  **Build Command:** `npm install`
4.  **Start Command:** `node server.js`
5.  Add Environment Variables:
    - `MONGODB_URI`: `YOUR_MONGODB_ATLAS_CONNECTION_STRING`
    - `JWT_SECRET`: `A_STRONG_RANDOM_STRING`
    - `GEMINI_API_KEY`: `YOUR_GOOGLE_GEMINI_API_KEY`
    - `GOOGLE_CLIENT_ID`: `YOUR_GOOGLE_OAUTH_CLIENT_ID`
    - `GOOGLE_CLIENT_SECRET`: `YOUR_GOOGLE_OAUTH_CLIENT_SECRET`
    - `GOOGLE_REDIRECT_URI`: `YOUR_RENDER_BACKEND_URL/api/auth/google`
    - `VITE_FRONTEND_URL`: `YOUR_VERCEL_FRONTEND_URL`
6.  Deploy.

### Important: Google Cloud Console OAuth Update

Ensure `YOUR_VERCEL_FRONTEND_URL` and `YOUR_RENDER_BACKEND_URL/api/auth/google` are added to **Authorized redirect URIs** in your Google Cloud Console OAuth credentials.



