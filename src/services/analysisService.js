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
        // Guard: at least one valid identifier is required
        const hasEventId = !!analysisData.evento_id;
        const hasExternalId = !!analysisData.partido_externo_id;
        const hasMatchId = !!analysisData.partido_id;

        if (!hasEventId && !hasExternalId && !hasMatchId) {
            throw new Error('No se proporcionó ningún identificador de partido válido (partido_id, evento_id o partido_externo_id).');
        }

        let existingId = null;

        // 1. Try to find existing record — check all three identifier types
        if (hasExternalId) {
            const { data } = await supabase
                .from('analisis_partido')
                .select('id')
                .eq('partido_externo_id', analysisData.partido_externo_id)
                .maybeSingle();
            if (data) existingId = data.id;
        }

        if (!existingId && hasEventId) {
            const { data } = await supabase
                .from('analisis_partido')
                .select('id')
                .eq('evento_id', analysisData.evento_id)
                .maybeSingle();
            if (data) existingId = data.id;
        }

        if (!existingId && hasMatchId) {
            const { data } = await supabase
                .from('analisis_partido')
                .select('id')
                .eq('partido_id', analysisData.partido_id)
                .maybeSingle();
            if (data) existingId = data.id;
        }

        // 2. Prepare payload — strip null FK fields to avoid FK violations on INSERT
        const payload = { ...analysisData };
        if (!hasEventId) delete payload.evento_id;
        if (!hasExternalId) delete payload.partido_externo_id;
        if (!hasMatchId) delete payload.partido_id;

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
