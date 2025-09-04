export interface ChargingPoint {
  id: number;
  status: 'available' | 'in-use' | 'maintenance';
  currentUser?: {
    name: string;
    email: string;
  };
  startTime?: Date;
  endTime?: Date;
}

export interface WaitingListEntry {
  id: string;
  userName: string;
  email: string;
  joinTime: Date;
}

export interface ChargingSession {
  pointId: number;
  userName: string;
  email: string;
  startTime: Date;
  endTime: Date;
}

export interface Administrator {
  email: string;
  name: string;
  password: string;
  addedBy: string;
  addedAt: Date;
}

export interface AppSettings {
  maxChargingHours: number;
  emailNotifications: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
  lastSeen: Date;
  currentPointId?: number;
}