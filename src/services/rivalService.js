
import { supabase } from '../lib/supabaseClient';

const TABLE_NAME = 'rivales';

export const rivalService = {
    getAll: async () => {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('id_equipo, nombre_equipo, escudo');

        if (error) {
            console.error('Error in rivalService.getAll:', error);
            throw error;
        }
        return data || [];
    },

    getById: async (id) => {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('id_equipo', id)
            .single();

        if (error) throw error;
        return data;
    },

    create: async (rivalData) => {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .insert(rivalData)
            .select();

        if (error) throw error;
        return data;
    }
};
