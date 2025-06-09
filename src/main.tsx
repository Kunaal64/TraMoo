import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Get the Google Client ID from environment variables
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  // In a real application, you might want to handle this more gracefully
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <GoogleOAuthProvider
      clientId={googleClientId}
      onScriptLoadSuccess={() => {}}
      onScriptLoadError={() => console.error('Google OAuth script failed to load')}
    >
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
