
-- Create entrenamientos table
create table public.entrenamientos (
    id_entrenamiento uuid primary key default gen_random_uuid(),
    evento uuid references public.eventos(id) on delete cascade unique,
    calentamiento text,
    trabajo_separado text,
    trabajo_conjunto text,
    objetivos text,
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.entrenamientos enable row level security;

-- Policies (consistent with other tables)
create policy "Entrenamientos viewable by everyone" 
    on public.entrenamientos for select using (true);

create policy "Staff can manage entranamientos" 
    on public.entrenamientos for all using (
    exists (select 1 from public.usuarios where id = auth.uid() and tipo_usuario in ('staff', 'admin'))
);
