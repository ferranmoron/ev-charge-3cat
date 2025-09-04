import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChargingPoint, WaitingListEntry, AppSettings } from '@/types';
import { toast } from 'sonner';

export const useSupabaseChargingPoints = (settings: AppSettings, isAdmin: boolean, currentUserEmail?: string) => {
  const [chargingPoints, setChargingPoints] = useState<ChargingPoint[]>([]);
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load charging points
  const loadChargingPoints = async () => {
    try {
      const { data, error } = await supabase
        .from('ev_charging_points')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      const points = (data || []).map(point => ({
        id: point.id,
        status: point.status as 'available' | 'in-use' | 'maintenance',
        currentUser: point.current_user_name && point.current_user_email ? {
          name: point.current_user_name,
          email: point.current_user_email
        } : undefined,
        startTime: point.start_time ? new Date(point.start_time) : undefined,
        endTime: point.end_time ? new Date(point.end_time) : undefined
      }));

      setChargingPoints(points);
    } catch (error) {
      console.error('Error loading charging points:', error);
      toast.error('Error carregant punts de càrrega');
    }
  };

  // Load waiting list
  const loadWaitingList = async () => {
    try {
      const { data, error } = await supabase
        .from('ev_waiting_list')
        .select('*')
        .order('join_time', { ascending: true });

      if (error) throw error;

      const waitingEntries = (data || []).map(entry => ({
        id: entry.id,
        userName: entry.user_name,
        email: entry.email,
        joinTime: new Date(entry.join_time)
      }));

      setWaitingList(waitingEntries);
    } catch (error) {
      console.error('Error loading waiting list:', error);
      toast.error('Error carregant llista d\'espera');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChargingPoints();
    loadWaitingList();

    // Set up real-time subscriptions
    const pointsSubscription = supabase
      .channel('charging_points')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ev_charging_points' },
        () => {
          loadChargingPoints();
        }
      )
      .subscribe();

    const waitingSubscription = supabase
      .channel('waiting_list')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ev_waiting_list' },
        () => {
          loadWaitingList();
        }
      )
      .subscribe();

    return () => {
      pointsSubscription.unsubscribe();
      waitingSubscription.unsubscribe();
    };
  }, []);

  const addToWaitingList = async (userName: string, email: string): Promise<boolean> => {
    try {
      // Check if user is already in waiting list
      const { data: existing } = await supabase
        .from('ev_waiting_list')
        .select('id')
        .eq('email', email)
        .single();

      if (existing) {
        toast.error('Ja esteu a la llista d\'espera');
        return false;
      }

      const { error } = await supabase
        .from('ev_waiting_list')
        .insert({
          user_name: userName,
          email: email
        });

      if (error) throw error;

      toast.success(`${userName} afegit a la llista d'espera`);
      return true;
    } catch (error) {
      console.error('Error adding to waiting list:', error);
      toast.error('Error afegint a la llista d\'espera');
      return false;
    }
  };

  const removeFromWaitingList = async (entryId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ev_waiting_list')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      toast.success('Eliminat de la llista d\'espera');
      return true;
    } catch (error) {
      console.error('Error removing from waiting list:', error);
      toast.error('Error eliminant de la llista d\'espera');
      return false;
    }
  };

  const assignPointToUser = async (pointId: number, userName: string, email: string): Promise<boolean> => {
    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + settings.maxChargingHours * 60 * 60 * 1000);

      const { error } = await supabase
        .from('ev_charging_points')
        .update({
          status: 'in-use',
          current_user_name: userName,
          current_user_email: email,
          start_time: now.toISOString(),
          end_time: endTime.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', pointId);

      if (error) throw error;

      // Remove user from waiting list if they were there
      await supabase
        .from('ev_waiting_list')
        .delete()
        .eq('email', email);

      toast.success(`Punt ${pointId} assignat a ${userName}`);
      return true;
    } catch (error) {
      console.error('Error assigning point:', error);
      toast.error('Error assignant punt de càrrega');
      return false;
    }
  };

  const endSession = async (pointId: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ev_charging_points')
        .update({
          status: 'available',
          current_user_name: null,
          current_user_email: null,
          start_time: null,
          end_time: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', pointId);

      if (error) throw error;

      toast.success(`Sessió finalitzada al punt ${pointId}`);
      return true;
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Error finalitzant sessió');
      return false;
    }
  };

  const setPointMaintenance = async (pointId: number, inMaintenance: boolean): Promise<boolean> => {
    if (!isAdmin) return false;

    try {
      const { error } = await supabase
        .from('ev_charging_points')
        .update({
          status: inMaintenance ? 'maintenance' : 'available',
          current_user_name: null,
          current_user_email: null,
          start_time: null,
          end_time: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', pointId);

      if (error) throw error;

      toast.success(`Punt ${pointId} ${inMaintenance ? 'en manteniment' : 'disponible'}`);
      return true;
    } catch (error) {
      console.error('Error setting maintenance:', error);
      toast.error('Error canviant estat de manteniment');
      return false;
    }
  };

  return {
    chargingPoints,
    waitingList,
    loading,
    addToWaitingList,
    removeFromWaitingList,
    assignPointToUser,
    endSession,
    setPointMaintenance
  };
};