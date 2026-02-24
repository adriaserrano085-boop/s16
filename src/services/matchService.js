
import { supabase } from '../lib/supabaseClient';

const TABLE_NAME = 'partidos';

export const matchService = {
    getAll: async () => {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('id, Evento, Rival, es_local, lugar, marcador_local, marcador_visitante, ensayos_local, ensayos_visitante');

        if (error) {
            console.error('Error in matchService.getAll:', error);
            throw error;
        }
        return data || [];
    },

    create: async (matchData) => {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .insert(matchData)
            .select();

        if (error) throw error;
        return data;
    },

    update: async (id, matchData) => {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .update(matchData)
            .eq('Evento', id)
            .select();

        if (error) throw error;
        return data;
    }
};
