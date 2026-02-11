
-- Add unique constraint to asistencia table to enable UPSERT
alter table public.asistencia
add constraint asistencia_entrenamiento_jugador_key unique (entrenamiento, jugador);

-- Verify
select 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name as foreign_table_name,
    ccu.column_name as foreign_column_name 
from 
    information_schema.table_constraints as tc 
    join information_schema.key_column_usage as kcu on tc.constraint_name = kcu.constraint_name 
    join information_schema.constraint_column_usage as ccu on ccu.constraint_name = tc.constraint_name 
where constraint_type = 'UNIQUE' and tc.table_name='asistencia';
