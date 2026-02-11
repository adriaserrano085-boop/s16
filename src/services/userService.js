
import { supabase } from '../lib/supabaseClient';

const TABLE_NAME = 'usuarios';

const userService = {
    getAll: async () => {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .order('nombre', { ascending: true });

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

    update: async (id, userData) => {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .update(userData)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data;
    }
};

export default userService;
