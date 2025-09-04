import { useState, useEffect } from 'react';
import { Administrator } from '@/types';
import { toast } from 'sonner';

const STORAGE_KEY = 'ev-administrators';
const DEFAULT_ADMIN_PASSWORD = 'Admin2024!';
const DEFAULT_ADMIN = {
  email: 'fmoron.h@3cat.cat',
  name: 'Administrador Principal',
  password: DEFAULT_ADMIN_PASSWORD,
  addedBy: 'system',
  addedAt: new Date()
};

interface StoredAdministrator extends Omit<Administrator, 'addedAt'> {
  addedAt: string;
}

// Mock email service
const sendPasswordEmail = async (email: string, password: string, isNewAdmin: boolean = false) => {
  console.log(`📧 Email enviat a ${email}:`);
  console.log(`Assumpte: ${isNewAdmin ? 'Nou Administrador - ' : ''}Credencials d'Accés EV Charging`);
  console.log(`Estimat/da,`);
  console.log(`Les seves credencials per accedir al sistema d'administració:`);
  console.log(`Usuari: ${email}`);
  console.log(`Contrasenya: ${password}`);
  console.log(`Accedeixi al panell d'administració per gestionar els punts de càrrega.`);
  console.log(`Salutacions cordials.`);
  
  toast.success(`📧 Credencials enviades per correu a ${email}`, {
    description: isNewAdmin ? 'Nou administrador creat' : 'Contrasenya enviada'
  });
};

const generateRandomPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<string>('');
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const savedAdmins = localStorage.getItem(STORAGE_KEY);
    if (savedAdmins) {
      const parsed: StoredAdministrator[] = JSON.parse(savedAdmins);
      const adminsWithDates = parsed.map((admin) => ({
        ...admin,
        addedAt: new Date(admin.addedAt)
      }));
      setAdministrators(adminsWithDates);
    } else {
      // Initialize with default admin
      setAdministrators([DEFAULT_ADMIN]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([DEFAULT_ADMIN]));
    }

    // Check if user is logged in
    const savedUser = sessionStorage.getItem('current-admin');
    if (savedUser) {
      setCurrentUser(savedUser);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(administrators));
  }, [administrators]);

  const login = async (email: string, password: string): Promise<boolean> => {
    const admin = administrators.find(admin => admin.email.toLowerCase() === email.toLowerCase());
    if (admin && admin.password === password) {
      setCurrentUser(email);
      setIsLoggedIn(true);
      sessionStorage.setItem('current-admin', email);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser('');
    setIsLoggedIn(false);
    sessionStorage.removeItem('current-admin');
  };

  const addAdministrator = async (email: string, name: string): Promise<boolean> => {
    if (!isLoggedIn) return false;
    
    const exists = administrators.some(admin => admin.email.toLowerCase() === email.toLowerCase());
    if (exists) return false;

    const newPassword = generateRandomPassword();
    const newAdmin: Administrator = {
      email,
      name,
      password: newPassword,
      addedBy: currentUser,
      addedAt: new Date()
    };

    setAdministrators(prev => [...prev, newAdmin]);
    
    // Send password via email
    await sendPasswordEmail(email, newPassword, true);
    
    return true;
  };

  const removeAdministrator = (email: string): boolean => {
    if (!isLoggedIn || email === DEFAULT_ADMIN.email) return false;
    
    setAdministrators(prev => prev.filter(admin => admin.email !== email));
    return true;
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    if (!isLoggedIn) return false;
    
    const adminIndex = administrators.findIndex(admin => admin.email.toLowerCase() === email.toLowerCase());
    if (adminIndex === -1) return false;

    const newPassword = generateRandomPassword();
    const updatedAdmins = [...administrators];
    updatedAdmins[adminIndex] = {
      ...updatedAdmins[adminIndex],
      password: newPassword
    };
    
    setAdministrators(updatedAdmins);
    
    // Send new password via email
    await sendPasswordEmail(email, newPassword, false);
    
    return true;
  };

  const isAdmin = (email?: string): boolean => {
    const emailToCheck = email || currentUser;
    return administrators.some(admin => admin.email.toLowerCase() === emailToCheck.toLowerCase());
  };

  const getDefaultAdminCredentials = () => ({
    email: DEFAULT_ADMIN.email,
    password: DEFAULT_ADMIN_PASSWORD
  });

  return {
    currentUser,
    administrators,
    isLoggedIn,
    isAdmin: isAdmin(),
    login,
    logout,
    addAdministrator,
    removeAdministrator,
    resetPassword,
    checkIsAdmin: isAdmin,
    getDefaultAdminCredentials
  };
};