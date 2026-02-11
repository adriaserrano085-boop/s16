
import { supabase } from '../lib/supabaseClient';

const TABLE_NAME = 'entrenamientos';

export const trainingService = {
    getAll: async () => {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*');

        if (error) {
            console.error('Error in trainingService.getAll:', error);
            throw error;
        }
        return data || [];
    },

    getById: async (id) => {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('id_entrenamiento', id)
            .single();

        if (error) throw error;
        return data;
    },

    create: async (trainingData) => {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .insert(trainingData)
            .select();

        if (error) throw error;
        return data;
    },

    update: async (eventId, trainingData) => {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .update(trainingData)
            .eq('evento', eventId)
            .select();

        if (error) throw error;
        return data;
    }
};
