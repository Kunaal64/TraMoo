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