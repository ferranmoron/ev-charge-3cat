import { useState, useEffect } from 'react';
import { AppSettings } from '@/types';

const STORAGE_KEY = 'ev-app-settings';
const DEFAULT_SETTINGS: AppSettings = {
  maxChargingHours: 3,
  emailNotifications: true
};

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateMaxChargingHours = (hours: number) => {
    if (hours > 0 && hours <= 24) {
      setSettings(prev => ({ ...prev, maxChargingHours: hours }));
      return true;
    }
    return false;
  };

  const toggleEmailNotifications = () => {
    setSettings(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }));
  };

  return {
    settings,
    updateMaxChargingHours,
    toggleEmailNotifications
  };
};