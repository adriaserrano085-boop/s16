
import { supabase } from '../lib/supabaseClient';

const TABLE_NAME = 'eventos';

export const eventService = {
    getAll: async () => {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('id, tipo, fecha, hora, estado')
            .order('fecha', { ascending: false });

        if (error) {
            console.error('Error in eventService.getAll:', error);
            throw error;
        }
        return data || [];
    },

    create: async (eventData) => {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .insert(eventData)
            .select();

        if (error) throw error;
        return data;
    },

    update: async (id, eventData) => {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .update(eventData)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data;
    },

    delete: async (id) => {
        const { error } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
