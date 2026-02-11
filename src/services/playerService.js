
import { supabase } from '../lib/supabaseClient';

const TABLE_NAME = 'jugadores_propios';

const playerService = {
    getAll: async () => {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .order('apellidos', { ascending: true });

        if (error) throw error;
        return data;
    },

    getById: async (id) => {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    create: async (player) => {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .insert(player)
            .select();

        if (error) throw error;
        return data;
    },

    update: async (id, player) => {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .update(player)
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
    }
};

export default playerService;
