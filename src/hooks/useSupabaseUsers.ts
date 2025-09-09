import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { toast } from 'sonner';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const CHARGING_POINT_COORDS = {
  latitude: 41.3746438,
  longitude: 2.0674218
};
const MAX_DISTANCE_KM = 15;

// Funció per calcular distàncies
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radi de la Terra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distància en km
};

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

  const isValidUser = async (email: string): Promise<boolean> => {
        const { data, error } = await supabase
            .from('ev_users')
            .select('email')
            .eq('email', email)
            .single();
        
        return !!data && !error;
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
      // Verificar si el navegador suporta geolocalització
      if (!navigator.geolocation) {
        toast.error('El seu navegador no suporta geolocalització');
        return '';
      }

      // Obtenir la ubicació actual
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const userLat = position.coords.latitude;
      const userLon = position.coords.longitude;

      // Calcular distància al punt de càrrega
      const distance = calculateDistance(
        userLat,
        userLon,
        CHARGING_POINT_COORDS.latitude,
        CHARGING_POINT_COORDS.longitude
      );

      // Verificar si està dins del radi permès
      if (distance > MAX_DISTANCE_KM) {
        toast.error(`Has d'estar a menys de ${MAX_DISTANCE_KM}km del punt de càrrega`);
        return '';
      }

      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('ev_users')
        .upsert({
          email,
          name,
          is_online: true,
          last_seen: now,
          updated_at: now,
          latitude: userLat,
          longitude: userLon
        }, {
          onConflict: 'email'
        })
        .select()
        .single();

      if (error) throw error;
      
      setCurrentUserId(data.id);
      return data.id;
    } catch (error) {
      if (error instanceof GeolocationPositionError) {
        switch(error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Has de permetre l\'accés a la teva ubicació');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('No es pot determinar la teva ubicació');
            break;
          case error.TIMEOUT:
            toast.error('Temps d\'espera esgotat obtenint la ubicació');
            break;
        }
      } else {
        console.error('Error adding/updating user:', error);
        toast.error('Error registrant usuari');
      }
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
    getOnlineUsers,
    isValidUser
  };
};