import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Get the Google Client ID from environment variables
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Log the client ID for debugging (remove in production)
console.log('Google OAuth Client ID:', googleClientId ? 'Found' : 'Missing');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider 
      clientId={googleClientId}
      onScriptLoadError={() => console.error('Failed to load Google OAuth script')}
      onScriptLoadSuccess={() => console.log('Google OAuth script loaded successfully')}
    >
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
