import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ConfirmationState {
  [id: string]: {
    confirmed: boolean;
    date: string;
  };
}

export function useSync(userId: string | undefined, initialLocalState: ConfirmationState) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  
  // Pull data from Supabase on mount or when userId changes
  useEffect(() => {
    if (!userId || !supabase) return;

    const fetchRemoteData = async () => {
      setIsSyncing(true);
      try {
        const client = supabase as NonNullable<typeof supabase>
        const { data, error } = await client
          .from('user_progress')
          .select('confirmations, updated_at')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
          console.error('Error fetching remote data:', error);
          return;
        }

        if (data) {
          // Merge strategy: Remote wins if newer, or simple overwrite for now
          // For simplicity in this system, we'll let remote overwrite local on initial load
          // In a real sophisticated system, we'd compare timestamps per task
          
          // However, to be safe, let's just return the data so the component can decide
          // But here we are inside a hook... 
          // Let's expose a way to get this data out, or rely on the component to call a sync function.
          // Actually, let's just emit an event or update internal state that the consumer can use.
        }
      } catch (err) {
        console.error('Sync error:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    fetchRemoteData();
  }, [userId]);

  const saveToCloud = useCallback(async (newState: ConfirmationState) => {
    if (!userId || !supabase) return;
    
    setIsSyncing(true);
    try {
      const client = supabase as NonNullable<typeof supabase>
      const { error } = await client
        .from('user_progress')
        .upsert({ 
          user_id: userId, 
          confirmations: newState,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      
      setLastSynced(new Date());
    } catch (err) {
      console.error('Failed to save to cloud:', err);
      toast.error('云端同步失败', { description: '数据已保存在本地' });
    } finally {
      setIsSyncing(false);
    }
  }, [userId]);

  const loadFromCloud = useCallback(async (): Promise<ConfirmationState | null> => {
    if (!userId || !supabase) return null;
    
    setIsSyncing(true);
    try {
      const client = supabase as NonNullable<typeof supabase>
      const { data, error } = await client
        .from('user_progress')
        .select('confirmations')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') console.error('Error loading cloud data:', error);
        return null;
      }
      
      if (data) {
        setLastSynced(new Date());
        return data.confirmations as ConfirmationState;
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setIsSyncing(false);
    }
    return null;
  }, [userId]);

  return {
    isSyncing,
    lastSynced,
    saveToCloud,
    loadFromCloud,
    isConfigured: !!supabase
  };
}
