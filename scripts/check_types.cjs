const { Client } = require('pg');
const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_U0vCalO7zufg@ep-bold-recipe-alp1x8ep-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require'
});

async function run() {
    await client.connect();
    const res = await client.query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name IN ('asistencia', 'entrenamientos', 'jugadores_propios') 
      AND column_name IN ('id', 'id_entrenamiento', 'entrenamiento_id', 'jugador_id')
  `);
    console.table(res.rows);
    await client.end();
}
run();
