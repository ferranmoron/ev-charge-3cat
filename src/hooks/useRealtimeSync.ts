import { useState, useEffect } from 'react';
import { ChargingPoint, WaitingListEntry, User, Administrator, AppSettings } from '@/types';

// Simulated real-time sync using localStorage with broadcast channel
const SYNC_KEYS = {
  CHARGING_POINTS: 'ev-charging-points-sync',
  WAITING_LIST: 'ev-waiting-list-sync',
  USERS: 'ev-users-sync',
  ADMINISTRATORS: 'ev-administrators-sync',
  SETTINGS: 'ev-settings-sync'
};

export const useRealtimeSync = () => {
  const [syncChannel] = useState(() => new BroadcastChannel('ev-charging-sync'));

  // Broadcast data change to other tabs/windows
  const broadcastChange = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    }));
    
    syncChannel.postMessage({
      type: 'DATA_CHANGE',
      key,
      data,
      timestamp: Date.now()
    });
  };

  // Listen for changes from other tabs/windows
  const subscribeToChanges = (key: string, callback: (data: any) => void) => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'DATA_CHANGE' && event.data.key === key) {
        callback(event.data.data);
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          callback(parsed.data);
        } catch (error) {
          console.error('Error parsing storage data:', error);
        }
      }
    };

    syncChannel.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      syncChannel.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorageChange);
    };
  };

  // Get initial data from localStorage
  const getInitialData = (key: string, defaultValue: any) => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.data || defaultValue;
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
    return defaultValue;
  };

  return {
    broadcastChange,
    subscribeToChanges,
    getInitialData,
    SYNC_KEYS
  };
};

// Hook for synced charging points
export const useSyncedChargingPoints = (settings: AppSettings, isAdmin: boolean) => {
  const { broadcastChange, subscribeToChanges, getInitialData, SYNC_KEYS } = useRealtimeSync();
  
  // Initialize with 18 charging points
  const initialPoints: ChargingPoint[] = Array.from({ length: 18 }, (_, i) => ({
    id: i + 1,
    status: 'available'
  }));

  const [chargingPoints, setChargingPoints] = useState<ChargingPoint[]>(() => 
    getInitialData(SYNC_KEYS.CHARGING_POINTS, initialPoints)
  );

  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>(() =>
    getInitialData(SYNC_KEYS.WAITING_LIST, [])
  );

  useEffect(() => {
    const unsubscribePoints = subscribeToChanges(SYNC_KEYS.CHARGING_POINTS, setChargingPoints);
    const unsubscribeWaiting = subscribeToChanges(SYNC_KEYS.WAITING_LIST, setWaitingList);

    return () => {
      unsubscribePoints();
      unsubscribeWaiting();
    };
  }, []);

  const updateChargingPoints = (newPoints: ChargingPoint[]) => {
    setChargingPoints(newPoints);
    broadcastChange(SYNC_KEYS.CHARGING_POINTS, newPoints);
  };

  const updateWaitingList = (newList: WaitingListEntry[]) => {
    setWaitingList(newList);
    broadcastChange(SYNC_KEYS.WAITING_LIST, newList);
  };

  const addToWaitingList = (userName: string, email: string): boolean => {
    const exists = waitingList.some(entry => entry.email.toLowerCase() === email.toLowerCase());
    if (exists) return false;

    const newEntry: WaitingListEntry = {
      id: Math.random().toString(36).substr(2, 9),
      userName,
      email,
      joinTime: new Date()
    };

    const newList = [...waitingList, newEntry];
    updateWaitingList(newList);
    return true;
  };

  const removeFromWaitingList = (entryId: string): boolean => {
    const newList = waitingList.filter(entry => entry.id !== entryId);
    updateWaitingList(newList);
    return true;
  };

  const assignPointToUser = (pointId: number, userName: string, email: string): boolean => {
    const now = new Date();
    const endTime = new Date(now.getTime() + settings.maxChargingHours * 60 * 60 * 1000);

    const newPoints = chargingPoints.map(point =>
      point.id === pointId
        ? {
            ...point,
            status: 'in-use' as const,
            currentUser: { name: userName, email },
            startTime: now,
            endTime
          }
        : point
    );

    updateChargingPoints(newPoints);

    // Remove from waiting list
    const newWaitingList = waitingList.filter(entry => entry.email !== email);
    updateWaitingList(newWaitingList);

    return true;
  };

  const endSession = (pointId: number): boolean => {
    const newPoints = chargingPoints.map(point =>
      point.id === pointId
        ? {
            ...point,
            status: 'available' as const,
            currentUser: undefined,
            startTime: undefined,
            endTime: undefined
          }
        : point
    );

    updateChargingPoints(newPoints);
    return true;
  };

  const setPointMaintenance = (pointId: number, inMaintenance: boolean): boolean => {
    if (!isAdmin) return false;

    const newPoints = chargingPoints.map(point =>
      point.id === pointId
        ? {
            ...point,
            status: inMaintenance ? 'maintenance' as const : 'available' as const,
            currentUser: undefined,
            startTime: undefined,
            endTime: undefined
          }
        : point
    );

    updateChargingPoints(newPoints);
    return true;
  };

  return {
    chargingPoints,
    waitingList,
    addToWaitingList,
    removeFromWaitingList,
    assignPointToUser,
    endSession,
    setPointMaintenance
  };
};

// Hook for synced users
export const useSyncedUsers = () => {
  const { broadcastChange, subscribeToChanges, getInitialData, SYNC_KEYS } = useRealtimeSync();
  
  const [users, setUsers] = useState<User[]>(() =>
    getInitialData(SYNC_KEYS.USERS, [])
  );
  
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    const unsubscribe = subscribeToChanges(SYNC_KEYS.USERS, setUsers);
    return unsubscribe;
  }, []);

  // Heartbeat to keep user online
  useEffect(() => {
    if (!currentUserId) return;

    const heartbeat = setInterval(() => {
      updateUserHeartbeat(currentUserId);
    }, 30000);

    return () => clearInterval(heartbeat);
  }, [currentUserId]);

  const updateUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    broadcastChange(SYNC_KEYS.USERS, newUsers);
  };

  const addOrUpdateUser = (name: string, email: string): string => {
    const userId = email; // Use email as ID
    const now = new Date();

    const existingIndex = users.findIndex(u => u.id === userId);
    let newUsers: User[];

    if (existingIndex >= 0) {
      newUsers = [...users];
      newUsers[existingIndex] = {
        ...newUsers[existingIndex],
        name,
        email,
        isOnline: true,
        lastSeen: now
      };
    } else {
      const newUser: User = {
        id: userId,
        name,
        email,
        isOnline: true,
        lastSeen: now
      };
      newUsers = [...users, newUser];
    }

    updateUsers(newUsers);
    setCurrentUserId(userId);
    return userId;
  };

  const updateUserHeartbeat = (userId: string) => {
    const newUsers = users.map(user =>
      user.id === userId
        ? { ...user, isOnline: true, lastSeen: new Date() }
        : user
    );
    updateUsers(newUsers);
  };

  const updateUserChargingPoint = (userId: string, pointId?: number) => {
    const newUsers = users.map(user =>
      user.id === userId
        ? { ...user, currentPointId: pointId }
        : user
    );
    updateUsers(newUsers);
  };

  const getCurrentUser = (): User | undefined => {
    return users.find(user => user.id === currentUserId);
  };

  const getOnlineUsers = (): User[] => {
    const now = new Date();
    return users.filter(user => {
      const timeDiff = now.getTime() - user.lastSeen.getTime();
      return timeDiff < 60000; // Consider online if seen within last minute
    });
  };

  return {
    users,
    currentUserId,
    addOrUpdateUser,
    updateUserHeartbeat,
    updateUserChargingPoint,
    getCurrentUser,
    getOnlineUsers
  };
};