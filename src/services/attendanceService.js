
import { supabase } from '../lib/supabaseClient';

const TABLE_NAME = 'asistencia';

// Helper functions defined separately to avoid self-reference issues

const getAll = async () => {
    // Step 1: Fetch attendance with related training and player info
    const { data: attendanceData, error: attendanceError } = await supabase
        .from(TABLE_NAME)
        .select('*, entrenamientos(*)')
        .limit(5000);

    if (attendanceError) throw attendanceError;

    if (!attendanceData || attendanceData.length === 0) return [];

    // Step 2: Extract unique event IDs from the trainings
    const eventIds = [...new Set(attendanceData
        .map(record => record.entrenamientos?.evento)
        .filter(id => id))];

    if (eventIds.length === 0) return attendanceData;

    // Step 3: Fetch related events details
    const { data: eventsData, error: eventsError } = await supabase
        .from('eventos')
        .select('id, tipo, fecha') // Fetching id (UUID) for mapping
        .in('id', eventIds);

    if (eventsError) throw eventsError;

    // Step 4: Map event details back to attendance records, and DEDUPLICATE
    // If an event has multiple training entries (duplicates in entrenamientos table),
    // we de-duplicate by keeping one record per (jugador, eventDate) pair.
    const eventsMap = {};
    eventsData.forEach(event => {
        eventsMap[event.id] = event;
    });

    const seen = new Set(); // Track unique (jugador, eventDate) combinations
    const enrichedData = [];

    for (const record of attendanceData) {
        const eventId = record.entrenamientos?.evento;
        const eventDetail = eventsMap[eventId];
        const eventDate = eventDetail?.fecha || eventDetail?.date;

        const dedupeKey = `${record.jugador}_${eventDate}`;
        if (seen.has(dedupeKey)) {
            continue; // Skip duplicate entries for the same player on the same day
        }
        seen.add(dedupeKey);

        enrichedData.push({
            ...record,
            eventos: eventDetail ? {
                ...eventDetail,
                date: eventDate,
                Tipo: eventDetail.tipo
            } : null
        });
    }

    return enrichedData;
};

const getById = async (id) => {
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

const getByTrainingId = async (trainingId) => {
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('entrenamiento', trainingId);

    if (error) throw error;
    return data;
};

const getByEventId = async (eventId) => {
    // Step 1: Find ALL training sessions linked to this event UUID
    // (there may be duplicates in the entrenamientos table)
    const { data: trainingData, error: trainingError } = await supabase
        .from('entrenamientos')
        .select('id_entrenamiento')
        .eq('evento', eventId);

    if (trainingError || !trainingData || trainingData.length === 0) {
        console.log('No training found for event:', eventId);
        return [];
    }

    // Use the first (canonical) training ID to avoid duplicate attendance records
    const trainingId = trainingData[0].id_entrenamiento;
    return getByTrainingId(trainingId);
};

const getByEventIds = async (eventIds) => {
    if (!eventIds || eventIds.length === 0) return [];

    // Step 1: Find training sessions linked to these event UUIDs
    const { data: trainingData, error: trainingError } = await supabase
        .from('entrenamientos')
        .select('id_entrenamiento, evento')
        .in('evento', eventIds);

    if (trainingError) {
        console.error('Error fetching trainings for events:', trainingError);
        return [];
    }

    if (!trainingData || trainingData.length === 0) {
        return [];
    }

    const trainingIds = trainingData.map(t => t.id_entrenamiento);

    // Step 2: Fetch attendance for these trainings
    const { data: attendanceData, error: attendanceError } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .in('entrenamiento', trainingIds);

    if (attendanceError) {
        console.error('Error fetching attendance:', attendanceError);
        throw attendanceError;
    }

    // Map attendance back to event IDs for easier consumption
    // We can return the raw attendance data knowing the caller can map it via training -> event
    // Or we can enrich it here. Let's return the raw attendance data + the training-event mapping helper
    // For now, returning the raw attendance list is flexible enough.
    // But let's attach the eventId to each attendance record for easier grouping if possible?
    // The attendance record has 'entrenamiento' (trainingId).
    // We have a map of trainingId -> eventId from trainingData.

    const trainingToEventMap = {};
    trainingData.forEach(t => {
        trainingToEventMap[t.id_entrenamiento] = t.evento;
    });

    return attendanceData.map(a => ({
        ...a,
        eventId: trainingToEventMap[a.entrenamiento]
    }));
};

const getByPlayerId = async (playerId) => {
    // Step 1: Fetch all attendance records for the player
    const { data: attendanceData, error: attendanceError } = await supabase
        .from(TABLE_NAME)
        .select('*, entrenamientos!inner(id_entrenamiento, evento)') // Inner join to ensure training exists
        .eq('jugador', playerId);

    if (attendanceError) throw attendanceError;

    if (!attendanceData || attendanceData.length === 0) return [];

    // Step 2: Extract event IDs
    const eventIds = [...new Set(attendanceData
        .map(a => a.entrenamientos?.evento)
        .filter(id => id))];

    if (eventIds.length === 0) return attendanceData;

    // Step 3: Fetch event details
    const { data: eventsData, error: eventsError } = await supabase
        .from('eventos')
        .select('*')
        .in('id', eventIds);

    if (eventsError) throw eventsError;

    const eventsMap = {};
    eventsData.forEach(e => eventsMap[e.id] = e);

    // Step 4: Combine data
    return attendanceData.map(record => {
        const eventId = record.entrenamientos?.evento;
        const event = eventsMap[eventId];

        return {
            ...record,
            event: event || null,
            date: event?.fecha || event?.date, // Flatten date for easier sorting
            type: event?.tipo || event?.Tipo || 'Desconocido'
        };
    }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending
};

const upsert = async (attendanceData) => {
    // attendanceData expects: { entrenamiento: UUID, jugador: UUID, asistencia: string }
    // Can be a single object or an array of objects

    const records = Array.isArray(attendanceData) ? attendanceData : [attendanceData];
    const results = [];

    for (const record of records) {
        try {
            // Check if record already exists
            const { data: existing, error: checkError } = await supabase
                .from(TABLE_NAME)
                .select('id')
                .eq('entrenamiento', record.entrenamiento)
                .eq('jugador', record.jugador)
                .maybeSingle();

            if (checkError) {
                console.error('Error checking existing attendance:', checkError);
                throw checkError;
            }

            if (existing) {
                // Update existing record
                const { data: updated, error: updateError } = await supabase
                    .from(TABLE_NAME)
                    .update({ asistencia: record.asistencia })
                    .eq('id', existing.id)
                    .select()
                    .single();

                if (updateError) throw updateError;
                results.push(updated);
            } else {
                // Insert new record
                const { data: inserted, error: insertError } = await supabase
                    .from(TABLE_NAME)
                    .insert(record)
                    .select()
                    .single();

                if (insertError) throw insertError;
                results.push(inserted);
            }
        } catch (err) {
            console.error('Error processing attendance record:', err);
            throw new Error(`Error saving attendance: ${err.message}`);
        }
    }

    return { message: 'Asistencia guardada correctamente', data: results };
};

const update = async (id, attendanceData) => {
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(attendanceData)
        .eq('id', id)
        .select();

    if (error) throw error;
    return data;
};

const remove = async (id) => { // Renamed from delete to remove to avoid reserved word conflict if used standalone
    const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};

const attendanceService = {
    getAll,
    getById,
    getByTrainingId,
    getByEventId,
    getByEventIds,
    getByPlayerId,
    upsert,
    update,
    delete: remove
};

export default attendanceService;
