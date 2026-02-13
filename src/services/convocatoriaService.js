import { supabase } from '../lib/supabaseClient';

const TABLE_NAME = 'convocatoria';

export const convocatoriaService = {
    /**
     * Get all squad entries for a given match
     */
    getByMatchId: async (partidoId) => {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('partido', partidoId)
            .order('numero', { ascending: true });

        if (error) {
            console.error('Error in convocatoriaService.getByMatchId:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Save the full squad for a match (delete existing + insert new)
     */
    saveSquad: async (partidoId, players) => {
        // 1. Delete existing entries for this match
        const { error: deleteError } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('partido', partidoId);

        if (deleteError) {
            console.error('Error deleting old convocatoria:', deleteError);
            throw deleteError;
        }

        // 2. Insert new entries (only non-empty slots)
        const entries = players
            .filter(p => p.jugador)
            .map(p => ({
                partido: partidoId,
                jugador: p.jugador,
                numero: p.numero
            }));

        if (entries.length === 0) return [];

        const { data, error: insertError } = await supabase
            .from(TABLE_NAME)
            .insert(entries)
            .select();

        if (insertError) {
            console.error('Error saving convocatoria:', insertError);
            throw insertError;
        }
        return data;
    }
};
