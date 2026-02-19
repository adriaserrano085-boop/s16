import { supabase } from '../lib/supabaseClient';

export const analysisService = {
    // Get analysis for a match
    getByEventId: async (eventId) => {
        const { data, error } = await supabase
            .from('analisis_partido')
            .select('*')
            .eq('evento_id', eventId)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    getByExternalMatchId: async (externalId) => {
        const { data, error } = await supabase
            .from('analisis_partido')
            .select('*')
            .eq('partido_externo_id', externalId)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    // Get all analyses (for evolution calculation)
    getAll: async () => {
        const { data, error } = await supabase
            .from('analisis_partido')
            .select('*');
        if (error) throw error;
        return data;
    },

    // Save or update analysis
    upsert: async (analysisData) => {
        // STRATEGY: Fetch first to get the ID, then Update. 
        // This avoids relying on Unique Constraints which might be missing.

        let existingId = null;

        // 1. Try to find existing record
        if (analysisData.partido_externo_id) {
            const { data } = await supabase
                .from('analisis_partido')
                .select('id')
                .eq('partido_externo_id', analysisData.partido_externo_id)
                .maybeSingle();
            if (data) existingId = data.id;
        } else if (analysisData.evento_id) {
            const { data } = await supabase
                .from('analisis_partido')
                .select('id')
                .eq('evento_id', analysisData.evento_id)
                .maybeSingle();
            if (data) existingId = data.id;
        }

        // 2. Prepare payload
        const payload = { ...analysisData };
        if (existingId) {
            payload.id = existingId; // Force update on PK
        }

        // 3. Upsert (if ID is present, it updates; if not, it inserts)
        const { data, error } = await supabase
            .from('analisis_partido')
            .upsert(payload)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
