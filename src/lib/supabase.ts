import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://knszphioyuftiwgsnhkh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtuc3pwaGlveXVmdGl3Z3NuaGtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4OTQwOTcsImV4cCI6MjA3MjQ3MDA5N30.tVnq3Sw4_D2fbul9WDb_yu1gI7Ec_YITnOeE-3teeFs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      ev_users: {
        Row: {
          id: string;
          email: string;
          name: string;
          is_online: boolean;
          last_seen: string;
          current_point_id: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          is_online?: boolean;
          last_seen?: string;
          current_point_id?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          is_online?: boolean;
          last_seen?: string;
          current_point_id?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ev_charging_points: {
        Row: {
          id: number;
          status: 'available' | 'in-use' | 'maintenance';
          current_user_name: string | null;
          current_user_email: string | null;
          start_time: string | null;
          end_time: string | null;
          updated_at: string;
        };
        Insert: {
          id: number;
          status: 'available' | 'in-use' | 'maintenance';
          current_user_name?: string | null;
          current_user_email?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: number;
          status?: 'available' | 'in-use' | 'maintenance';
          current_user_name?: string | null;
          current_user_email?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          updated_at?: string;
        };
      };
      ev_waiting_list: {
        Row: {
          id: string;
          user_name: string;
          email: string;
          join_time: string;
          preferred_point_id: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_name: string;
          email: string;
          join_time?: string;
          preferred_point_id?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_name?: string;
          email?: string;
          join_time?: string;
          preferred_point_id?: number | null;
          created_at?: string;
        };
      };
      ev_administrators: {
        Row: {
          id: string;
          email: string;
          name: string;
          password: string;
          added_by: string;
          added_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          password: string;
          added_by: string;
          added_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          password?: string;
          added_by?: string;
          added_at?: string;
        };
      };
      ev_app_settings: {
        Row: {
          id: string;
          max_charging_hours: number;
          email_notifications: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          max_charging_hours?: number;
          email_notifications?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          max_charging_hours?: number;
          email_notifications?: boolean;
          updated_at?: string;
        };
      };
    };
  };
}