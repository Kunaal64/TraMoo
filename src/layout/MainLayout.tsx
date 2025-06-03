import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useSearch } from '../context/SearchContext';

const MainLayout = () => {
  const { searchQuery, isSearchOpen } = useSearch();

  return (
    <div className="transition-colors">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
