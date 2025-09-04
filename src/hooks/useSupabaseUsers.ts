import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { toast } from 'sonner';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export const useSupabaseUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Load users from Supabase
  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('ev_users')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const usersWithDates = (data || []).map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        isOnline: user.is_online,
        lastSeen: new Date(user.last_seen),
        currentPointId: user.current_point_id || undefined
      }));
      
      setUsers(usersWithDates);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error carregant usuaris');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();

    // Set up real-time subscription
    const subscription = supabase
      .channel('users')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ev_users' },
        () => {
          loadUsers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
    const checkOfflineUsers = setInterval(async () => {
      const now = new Date();
      const offlineThreshold = 60000; // 1 minute

      try {
        const { error } = await supabase
          .from('ev_users')
          .update({ 
            is_online: false,
            updated_at: now.toISOString()
          })
          .lt('last_seen', new Date(now.getTime() - offlineThreshold).toISOString());

        if (error) throw error;
      } catch (error) {
        console.error('Error updating offline users:', error);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkOfflineUsers);
  }, []);

  const addOrUpdateUser = async (name: string, email: string): Promise<string> => {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('ev_users')
        .upsert({
          email,
          name,
          is_online: true,
          last_seen: now,
          updated_at: now
        }, {
          onConflict: 'email'
        })
        .select()
        .single();

      if (error) throw error;
      
      setCurrentUserId(data.id);
      return data.id;
    } catch (error) {
      console.error('Error adding/updating user:', error);
      toast.error('Error registrant usuari');
      return '';
    }
  };

  const updateUserHeartbeat = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('ev_users')
        .update({ 
          is_online: true, 
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating heartbeat:', error);
    }
  };

  const updateUserChargingPoint = async (userId: string, pointId?: number) => {
    try {
      const { error } = await supabase
        .from('ev_users')
        .update({ 
          current_point_id: pointId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user charging point:', error);
    }
  };

  const removeUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('ev_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      if (currentUserId === userId) {
        setCurrentUserId('');
      }
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Error eliminant usuari');
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
    loading,
    addOrUpdateUser,
    updateUserHeartbeat,
    updateUserChargingPoint,
    removeUser,
    getCurrentUser,
    getOnlineUsers
  };
};