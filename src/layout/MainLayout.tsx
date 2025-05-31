import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const MainLayout = () => {
  return (
    <div className="min-h-screen transition-colors">
      <Navbar />
      <main className="flex-1 bg-background">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
