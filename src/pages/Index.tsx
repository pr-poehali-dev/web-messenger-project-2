import { useState, useEffect } from 'react';
import LoginScreen from '@/components/messenger/LoginScreen';
import ProfileSetup from '@/components/messenger/ProfileSetup';
import MainMessenger from '@/components/messenger/MainMessenger';

export interface User {
  id: number;
  username: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  is_admin: boolean;
  is_verified: boolean;
  is_friend_of_admin: boolean;
}

export default function Index() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      if (!user.display_name || !user.first_name) {
        setNeedsProfile(true);
      }
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    if (!user.display_name || !user.first_name) {
      setNeedsProfile(true);
    }
  };

  const handleProfileComplete = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setNeedsProfile(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setNeedsProfile(false);
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (needsProfile) {
    return <ProfileSetup user={currentUser} onComplete={handleProfileComplete} />;
  }

  return <MainMessenger user={currentUser} onLogout={handleLogout} />;
}