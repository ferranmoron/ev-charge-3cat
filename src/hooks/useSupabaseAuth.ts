import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Administrator {
  id: string;
  email: string;
  name: string;
  password: string;
  added_by: string;
  added_at: string;
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

export const useSupabaseAuth = () => {
  const [currentUser, setCurrentUser] = useState<string>('');
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load administrators from Supabase
  const loadAdministrators = async () => {
    try {
      const { data, error } = await supabase
        .from('ev_administrators')
        .select('*')
        .order('added_at', { ascending: true });

      if (error) throw error;
      setAdministrators(data || []);
    } catch (error) {
      console.error('Error loading administrators:', error);
      toast.error('Error carregant administradors');
    }
  };

  useEffect(() => {
    loadAdministrators();
    
    // Check if user is logged in
    const savedUser = sessionStorage.getItem('current-admin');
    if (savedUser) {
      setCurrentUser(savedUser);
      setIsLoggedIn(true);
    }
    
    setLoading(false);

    // Set up real-time subscription for administrators
    const subscription = supabase
      .channel('administrators')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ev_administrators' },
        () => {
          loadAdministrators();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('ev_administrators')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('password', password)
        .single();

      if (error || !data) return false;

      setCurrentUser(email);
      setIsLoggedIn(true);
      sessionStorage.setItem('current-admin', email);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser('');
    setIsLoggedIn(false);
    sessionStorage.removeItem('current-admin');
  };

  const addAdministrator = async (email: string, name: string): Promise<boolean> => {
    if (!isLoggedIn) return false;
    
    try {
      // Check if admin already exists
      const { data: existing } = await supabase
        .from('ev_administrators')
        .select('email')
        .eq('email', email.toLowerCase())
        .single();

      if (existing) return false;

      const newPassword = generateRandomPassword();
      
      const { error } = await supabase
        .from('ev_administrators')
        .insert({
          email: email.toLowerCase(),
          name,
          password: newPassword,
          added_by: currentUser
        });

      if (error) throw error;

      // Send password via email
      await sendPasswordEmail(email, newPassword, true);
      
      return true;
    } catch (error) {
      console.error('Error adding administrator:', error);
      toast.error('Error afegint administrador');
      return false;
    }
  };

  const removeAdministrator = async (email: string): Promise<boolean> => {
    if (!isLoggedIn || email === 'fmoron.h@3cat.cat') return false;
    
    try {
      const { error } = await supabase
        .from('ev_administrators')
        .delete()
        .eq('email', email);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing administrator:', error);
      toast.error('Error eliminant administrador');
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    if (!isLoggedIn) return false;
    
    try {
      const newPassword = generateRandomPassword();
      
      const { error } = await supabase
        .from('ev_administrators')
        .update({ password: newPassword })
        .eq('email', email);

      if (error) throw error;

      // Send new password via email
      await sendPasswordEmail(email, newPassword, false);
      
      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Error restablint contrasenya');
      return false;
    }
  };

  const isAdmin = (email?: string): boolean => {
    const emailToCheck = email || currentUser;
    return administrators.some(admin => admin.email.toLowerCase() === emailToCheck.toLowerCase());
  };

  const getDefaultAdminCredentials = () => ({
    email: 'fmoron.h@3cat.cat',
    password: 'Admin2024!'
  });

  return {
    currentUser,
    administrators,
    isLoggedIn,
    loading,
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