import { useState, useEffect } from 'react';
import { User } from '@/types';

const STORAGE_KEY = 'ev-users';
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

interface StoredUser extends Omit<User, 'lastSeen'> {
  lastSeen: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    const savedUsers = localStorage.getItem(STORAGE_KEY);
    if (savedUsers) {
      const parsed: StoredUser[] = JSON.parse(savedUsers);
      const usersWithDates = parsed.map((user) => ({
        ...user,
        lastSeen: new Date(user.lastSeen)
      }));
      setUsers(usersWithDates);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  // Heartbeat to keep user online
  useEffect(() => {
    if (!currentUserId) return;

    const heartbeat = setInterval(() => {
      updateUserHeartbeat(currentUserId);
    }, HEARTBEAT_INTERVAL);

    return () => clearInterval(heartbeat);
  }, [currentUserId]);

  // Check for offline users
  useEffect(() => {
    const checkOfflineUsers = setInterval(() => {
      const now = new Date();
      const offlineThreshold = 60000; // 1 minute

      setUsers(prev => prev.map(user => ({
        ...user,
        isOnline: now.getTime() - user.lastSeen.getTime() < offlineThreshold
      })));
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkOfflineUsers);
  }, []);

  const addOrUpdateUser = (name: string, email: string): string => {
    const userId = email; // Use email as unique ID
    const now = new Date();

    setUsers(prev => {
      const existingIndex = prev.findIndex(u => u.id === userId);
      if (existingIndex >= 0) {
        // Update existing user
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          name,
          email,
          isOnline: true,
          lastSeen: now
        };
        return updated;
      } else {
        // Add new user
        const newUser: User = {
          id: userId,
          name,
          email,
          isOnline: true,
          lastSeen: now
        };
        return [...prev, newUser];
      }
    });

    setCurrentUserId(userId);
    return userId;
  };

  const updateUserHeartbeat = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, isOnline: true, lastSeen: new Date() }
        : user
    ));
  };

  const updateUserChargingPoint = (userId: string, pointId?: number) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, currentPointId: pointId }
        : user
    ));
  };

  const removeUser = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
    if (currentUserId === userId) {
      setCurrentUserId('');
    }
  };

  const getCurrentUser = (): User | undefined => {
    return users.find(user => user.id === currentUserId);
  };

  const getOnlineUsers = (): User[] => {
    return users.filter(user => user.isOnline);
  };

  return {
    users,
    currentUserId,
    addOrUpdateUser,
    updateUserHeartbeat,
    updateUserChargingPoint,
    removeUser,
    getCurrentUser,
    getOnlineUsers
  };
};