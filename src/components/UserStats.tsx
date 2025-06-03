import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Camera, PenTool, Users } from 'lucide-react';

interface UserStatsData {
  countriesExplored: number;
  photosShared: number;
  storiesWritten: number;
  communityMembers: number;
}

const UserStats = () => {
  const [stats, setStats] = useState<UserStatsData>({
    countriesExplored: 0,
    photosShared: 0,
    storiesWritten: 0,
    communityMembers: 0
  });

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user-stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          console.error('Server returned error:', response.status);
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    fetchUserStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchUserStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const statItems = [
    {
      icon: MapPin,
      label: 'Countries Explored',
      value: stats.countriesExplored,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: Camera,
      label: 'Photos Shared',
      value: stats.photosShared,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      icon: PenTool,
      label: 'Stories Written',
      value: stats.storiesWritten,
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      icon: Users,
      label: 'Community Members',
      value: stats.communityMembers,
      color: 'text-orange-600 dark:text-orange-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="glass p-6 rounded-2xl text-center hover:scale-105 transition-transform duration-300"
        >
          <item.icon className={`w-8 h-8 mx-auto mb-3 ${item.color}`} />
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            {item.value.toLocaleString()}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {item.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default UserStats;