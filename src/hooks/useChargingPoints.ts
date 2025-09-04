import { useState, useEffect } from 'react';
import { ChargingPoint, WaitingListEntry, ChargingSession, AppSettings } from '@/types';
import { toast } from 'sonner';

const STORAGE_KEYS = {
  CHARGING_POINTS: 'ev-charging-points',
  WAITING_LIST: 'ev-waiting-list',
  SESSIONS: 'ev-sessions'
};

interface StoredChargingPoint extends Omit<ChargingPoint, 'startTime' | 'endTime'> {
  startTime?: string;
  endTime?: string;
}

interface StoredWaitingListEntry extends Omit<WaitingListEntry, 'joinTime'> {
  joinTime: string;
}

interface StoredChargingSession extends Omit<ChargingSession, 'startTime' | 'endTime'> {
  startTime: string;
  endTime: string;
}

// Mock email notification function
const sendEmailNotification = async (email: string, userName: string, pointId: number, duration: number) => {
  if (!email) return;
  
  // In a real application, this would integrate with an email service
  console.log(`📧 Email sent to ${email}:`);
  console.log(`Subject: Charging Session Completed - Point #${pointId}`);
  console.log(`Dear ${userName},`);
  console.log(`Your charging session at Point #${pointId} has ended after ${duration} hours.`);
  console.log(`Please remove your vehicle promptly to allow others to use the charging point.`);
  console.log(`Thank you for using our EV charging service!`);
  
  // Show toast notification as demo
  toast.info(`📧 Email notification sent to ${userName}`, {
    description: `Charging session ended at Point #${pointId}`
  });
};

export const useChargingPoints = (settings: AppSettings, isAdmin: boolean, currentUserEmail?: string) => {
  const [chargingPoints, setChargingPoints] = useState<ChargingPoint[]>([]);
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [sessions, setSessions] = useState<ChargingSession[]>([]);

  // Initialize charging points
  useEffect(() => {
    const savedPoints = localStorage.getItem(STORAGE_KEYS.CHARGING_POINTS);
    const savedWaitingList = localStorage.getItem(STORAGE_KEYS.WAITING_LIST);
    const savedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);

    if (savedPoints) {
      const parsed: StoredChargingPoint[] = JSON.parse(savedPoints);
      const pointsWithDates = parsed.map((point) => ({
        ...point,
        startTime: point.startTime ? new Date(point.startTime) : undefined,
        endTime: point.endTime ? new Date(point.endTime) : undefined,
      }));
      setChargingPoints(pointsWithDates);
    } else {
      const initialPoints: ChargingPoint[] = Array.from({ length: 18 }, (_, i) => ({
        id: i + 1,
        status: 'available'
      }));
      setChargingPoints(initialPoints);
    }

    if (savedWaitingList) {
      const parsed: StoredWaitingListEntry[] = JSON.parse(savedWaitingList);
      const listWithDates = parsed.map((entry) => ({
        ...entry,
        joinTime: new Date(entry.joinTime)
      }));
      setWaitingList(listWithDates);
    }

    if (savedSessions) {
      const parsed: StoredChargingSession[] = JSON.parse(savedSessions);
      const sessionsWithDates = parsed.map((session) => ({
        ...session,
        startTime: new Date(session.startTime),
        endTime: new Date(session.endTime)
      }));
      setSessions(sessionsWithDates);
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHARGING_POINTS, JSON.stringify(chargingPoints));
  }, [chargingPoints]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WAITING_LIST, JSON.stringify(waitingList));
  }, [waitingList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }, [sessions]);

  // Check for expired sessions
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setChargingPoints(prev => prev.map(point => {
        if (point.status === 'in-use' && point.endTime && now >= point.endTime) {
          // Session expired, send email notification
          if (settings.emailNotifications && point.currentUser) {
            const sessionDuration = point.startTime ? 
              Math.round((point.endTime.getTime() - point.startTime.getTime()) / (1000 * 60 * 60) * 10) / 10 : 
              settings.maxChargingHours;
            
            sendEmailNotification(
              point.currentUser.email,
              point.currentUser.name,
              point.id,
              sessionDuration
            );
          }

          return {
            ...point,
            status: 'available',
            currentUser: undefined,
            startTime: undefined,
            endTime: undefined
          };
        }
        return point;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.emailNotifications, settings.maxChargingHours]);

  // Auto-assign from waiting list when points become available
  useEffect(() => {
    const availablePoints = chargingPoints.filter(p => p.status === 'available');
    if (availablePoints.length > 0 && waitingList.length > 0) {
      const nextUser = waitingList[0];
      const pointToAssign = availablePoints[0];
      
      assignPointToUser(pointToAssign.id, nextUser.userName, nextUser.email);
      removeFromWaitingList(nextUser.id);
    }
  }, [chargingPoints, waitingList]);

  const addToWaitingList = (userName: string, email: string) => {
    const newEntry: WaitingListEntry = {
      id: Date.now().toString(),
      userName,
      email,
      joinTime: new Date()
    };
    setWaitingList(prev => [...prev, newEntry]);
  };

  const removeFromWaitingList = (id: string) => {
    const entry = waitingList.find(e => e.id === id);
    if (!entry) return;

    // Check if user can remove this entry
    const canRemove = isAdmin || (currentUserEmail && entry.email.toLowerCase() === currentUserEmail.toLowerCase());
    
    if (!canRemove) {
      toast.error('You can only remove yourself from the queue');
      return;
    }

    setWaitingList(prev => prev.filter(entry => entry.id !== id));
    
    if (currentUserEmail && entry.email.toLowerCase() === currentUserEmail.toLowerCase()) {
      toast.success('You have been removed from the waiting list');
    }
  };

  const assignPointToUser = (pointId: number, userName: string, email: string) => {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + settings.maxChargingHours * 60 * 60 * 1000);
    
    setChargingPoints(prev => prev.map(point => 
      point.id === pointId 
        ? {
            ...point,
            status: 'in-use' as const,
            currentUser: { name: userName, email },
            startTime,
            endTime
          }
        : point
    ));

    const session: ChargingSession = {
      pointId,
      userName,
      email,
      startTime,
      endTime
    };
    setSessions(prev => [...prev, session]);
  };

  const endSession = (pointId: number) => {
    if (!isAdmin) {
      toast.error('Only administrators can end charging sessions');
      return;
    }

    const point = chargingPoints.find(p => p.id === pointId);
    if (point && point.currentUser && settings.emailNotifications) {
      const sessionDuration = point.startTime ? 
        Math.round((new Date().getTime() - point.startTime.getTime()) / (1000 * 60 * 60) * 10) / 10 : 
        0;
      
      sendEmailNotification(
        point.currentUser.email,
        point.currentUser.name,
        pointId,
        sessionDuration
      );
    }

    setChargingPoints(prev => prev.map(point => 
      point.id === pointId 
        ? {
            ...point,
            status: 'available' as const,
            currentUser: undefined,
            startTime: undefined,
            endTime: undefined
          }
        : point
    ));
  };

  const setPointMaintenance = (pointId: number, maintenance: boolean) => {
    if (!isAdmin) {
      toast.error('Only administrators can set maintenance mode');
      return;
    }

    const point = chargingPoints.find(p => p.id === pointId);
    if (maintenance && point && point.currentUser && settings.emailNotifications) {
      // Notify user if point is being put into maintenance while in use
      const sessionDuration = point.startTime ? 
        Math.round((new Date().getTime() - point.startTime.getTime()) / (1000 * 60 * 60) * 10) / 10 : 
        0;
      
      sendEmailNotification(
        point.currentUser.email,
        point.currentUser.name,
        pointId,
        sessionDuration
      );
    }

    setChargingPoints(prev => prev.map(point => 
      point.id === pointId 
        ? {
            ...point,
            status: maintenance ? 'maintenance' as const : 'available' as const,
            currentUser: maintenance ? undefined : point.currentUser,
            startTime: maintenance ? undefined : point.startTime,
            endTime: maintenance ? undefined : point.endTime
          }
        : point
    ));
  };

  return {
    chargingPoints,
    waitingList,
    sessions,
    addToWaitingList,
    removeFromWaitingList,
    assignPointToUser,
    endSession,
    setPointMaintenance
  };
};