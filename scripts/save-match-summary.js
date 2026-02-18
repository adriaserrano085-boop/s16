
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const EXTERNAL_MATCH_ID = '40e57d01-48d7-41da-895d-6418f2c0cba4';

const rawInput = `
{
  "resumen": "Derrota severa del CRUC (7-69) ante una U.E. Santboiana muy superior. El partido se rompió definitivamente con la expulsión del zaguero local en el minuto 50. La UES dominó con un juego rápido a la mano, castigando la defensa local que se vio superada físicamente y en organización.",
  "analisis_dinamico": "La UES salió con mucha intensidad, anotando 3 ensayos en los primeros 17 minutos. El CRUC intentó reaccionar al inicio de la segunda parte con un ensayo de su capitán (min 42), reduciendo la distancia momentáneamente. Sin embargo, la tarjeta roja directa en el min 50 por un placaje peligroso dejó al CRUC con 14, provocando un colapso defensivo donde encajaron 38 puntos en los últimos 20 minutos.",
  "scouting_fases": {
    "mele": "La UES dominó el empuje, ganando sus propias melés y complicando la salida de ocho del CRUC, obligando al 9 local a jugar bajo presión.",
    "touch": "Plataforma segura para la UES. El CRUC perdió varias touches propias en momentos clave debido a la presión defensiva en el salto.",
    "rucks": "La UES limpió los rucks con gran velocidad, permitiendo una continuidad que desbordó al CRUC. El equipo local llegó tarde a los apoyos defensivos."
  },
  "ensayos": [
    {
      "minuto": 2,
      "equipo": "Visitante",
      [cite_start]"descripcion": "Ensayo de Graus Barras (13) tras ruptura de línea[cite: 258]."
    },
    {
      "minuto": 9,
      "equipo": "Visitante",
      [cite_start]"descripcion": "Ensayo de Castaño Valero (19) ampliando ventaja[cite: 258]."
    },
    {
      "minuto": 17,
      "equipo": "Visitante",
      [cite_start]"descripcion": "Ensayo de delantera de Cordero Rodriguez (1)[cite: 258]."
    },
    {
      "minuto": 33,
      "equipo": "Visitante",
      [cite_start]"descripcion": "Ensayo de Coradazzi Regaño (14) por el ala[cite: 258]."
    },
    {
      "minuto": 36,
      "equipo": "Visitante",
      [cite_start]"descripcion": "Ensayo de Graus Barras (13) antes del descanso[cite: 258]."
    },
    {
      "minuto": 42,
      "equipo": "Local",
      [cite_start]"descripcion": "Ensayo de Milla Ballester (8) de pick and go[cite: 253]."
    },
    {
      "minuto": 48,
      "equipo": "Visitante",
      [cite_start]"descripcion": "Ensayo de Coradazzi Regaño (14) tras jugada colectiva[cite: 258]."
    },
    {
      "minuto": 50,
      "equipo": "Visitante",
      [cite_start]"descripcion": "Ensayo de Graus Barras (13) coincidiendo con expulsión[cite: 258]."
    },
    {
      "minuto": 53,
      "equipo": "Visitante",
      [cite_start]"descripcion": "Ensayo de Coradazzi Regaño (14) aprovechando superioridad[cite: 258]."
    },
    {
      "minuto": 57,
      "equipo": "Visitante",
      [cite_start]"descripcion": "Ensayo de Coradazzi Regaño (14) en velocidad[cite: 258]."
    },
    {
      "minuto": 60,
      "equipo": "Visitante",
      [cite_start]"descripcion": "Ensayo de Fontanet Bartolomé (15)[cite: 258]."
    },
    {
      "minuto": 64,
      "equipo": "Visitante",
      [cite_start]"descripcion": "Ensayo final de Jorba Puig (7)[cite: 258]."
    }
  ],
  [cite_start]"disciplina": "El CRUC sufrió una Tarjeta Roja directa (Fourgeaud Tramullas, min 50) por placaje alto peligroso, lo que condicionó el resto del partido[cite: 272].",
  "estadisticas": {
    "posesion": {
      "local": 25,
      "visitante": 75
    },
    "placajes_hechos": {
      "local": 45,
      "visitante": 28
    },
    "placajes_fallados": {
      "local": 22,
      "visitante": 5
    },
    "turnovers": {
      "local": 3,
      "visitante": 12
    },
    "penaltis": {
      "local": 6,
      "visitante": 4
    },
    "mele": {
      "local_ganada": 3,
      "local_perdida": 4,
      "visitante_ganada": 7,
      "visitante_perdida": 0
    },
    "touch": {
      "local_ganada": 4,
      "local_perdida": 5,
      "visitante_ganada": 8,
      "visitante_perdida": 1
    }
  },
  "conclusion": "La UES impuso una superioridad física y técnica notable, reflejada en los placajes fallados por el CRUC. La expulsión en el minuto 50 terminó de hundir las opciones locales. Gran actuación de los alas visitantes."
}
`;

function cleanJson(input) {
    // Remove [cite_start]
    let cleaned = input.replace(/\[cite_start\]/g, '');
    // Remove [cite: ...]
    cleaned = cleaned.replace(/\[cite:[^\]]*\]/g, '');
    return JSON.parse(cleaned);
}

async function saveAnalysis() {
    try {
        const jsonObj = cleanJson(rawInput);
        console.log('JSON cleaned successfully.');

        // Prepare payload
        const payload = {
            partido_externo_id: EXTERNAL_MATCH_ID,
            raw_json: jsonObj,
            updated_at: new Date().toISOString()
        };

        // Upsert
        // 1. Check if exists
        const { data: existing } = await supabase
            .from('analisis_partido')
            .select('id')
            .eq('partido_externo_id', EXTERNAL_MATCH_ID)
            .maybeSingle();

        if (existing) {
            console.log('Updating existing analysis ID:', existing.id);
            const { error } = await supabase
                .from('analisis_partido')
                .update(payload)
                .eq('id', existing.id);
            if (error) throw error;
        } else {
            console.log('Creating new analysis record.');
            const { error } = await supabase
                .from('analisis_partido')
                .insert(payload);
            if (error) throw error;
        }

        console.log('Analysis saved successfully.');

    } catch (error) {
        console.error('Error:', error);
    }
}

saveAnalysis();
