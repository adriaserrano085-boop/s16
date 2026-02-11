-- SUPABASE DATABASE SETUP SCRIPT
-- RUN THIS IN THE SUPABASE SQL EDITOR

-- 1. Create custom types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'staff', 'player', 'family');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
        CREATE TYPE attendance_status AS ENUM ('present', 'late', 'absent');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
        CREATE TYPE event_type AS ENUM ('training', 'match', 'video', 'physical_tests', 'other');
    END IF;
END $$;

-- 2. Usuarios table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  tipo_usuario user_role DEFAULT 'player',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Equipos table
CREATE TABLE IF NOT EXISTS public.equipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  league TEXT,
  is_club_team BOOLEAN DEFAULT FALSE, -- TRUE for RC L'Hospitalet
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Jugadores table
CREATE TABLE IF NOT EXISTS public.jugadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.equipos(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT,
  birth_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. jugadores_propios table (Linking Users with Role 'player' to their Player record)
CREATE TABLE IF NOT EXISTS public.jugadores_propios (
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  jugador_id UUID REFERENCES public.jugadores(id) ON DELETE CASCADE,
  PRIMARY KEY (usuario_id, jugador_id)
);

-- 6. jugador_familia table (Linking Users with Role 'family' to Player records)
CREATE TABLE IF NOT EXISTS public.jugador_familia (
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  jugador_id UUID REFERENCES public.jugadores(id) ON DELETE CASCADE,
  PRIMARY KEY (usuario_id, jugador_id)
);

-- 7. Eventos table
CREATE TABLE IF NOT EXISTS public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.equipos(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type event_type DEFAULT 'training',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  location TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Asistencia table
CREATE TABLE IF NOT EXISTS public.asistencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.eventos(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.jugadores(id) ON DELETE CASCADE,
  status attendance_status DEFAULT 'present',
  notes TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, player_id)
);

-- 9. Estadisticas de Partido
CREATE TABLE IF NOT EXISTS public.estadisticas_partido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.jugadores(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.eventos(id) ON DELETE CASCADE,
  minutes INTEGER DEFAULT 0,
  tries INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  is_starter BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Pruebas Fisicas
CREATE TABLE IF NOT EXISTS public.pruebas_fisicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.jugadores(id) ON DELETE CASCADE,
  session_name TEXT NOT NULL, -- SEP, DIC, FEB, MAY
  test_date DATE DEFAULT CURRENT_DATE,
  results JSONB NOT NULL, -- Flexible structure for values
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Clasificacion de la Liga
CREATE TABLE IF NOT EXISTS public.clasificacion_liga (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.equipos(id) ON DELETE CASCADE,
  ranking INTEGER,
  points_for INTEGER DEFAULT 0,
  points_against INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Enable RLS for all tables
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jugadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estadisticas_partido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pruebas_fisicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clasificacion_liga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jugadores_propios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jugador_familia ENABLE ROW LEVEL SECURITY;

-- 12. Policies

-- Usuarios: Users can view all, but update only their own
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.usuarios;
CREATE POLICY "Public profiles are viewable by everyone." ON public.usuarios FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile." ON public.usuarios;
CREATE POLICY "Users can update own profile." ON public.usuarios FOR UPDATE USING (auth.uid() = id);

-- Equipos & Clasificacion: Everyone can read
DROP POLICY IF EXISTS "Teams are viewable by everyone." ON public.equipos;
CREATE POLICY "Teams are viewable by everyone." ON public.equipos FOR SELECT USING (true);
DROP POLICY IF EXISTS "League stats are viewable by everyone." ON public.clasificacion_liga;
CREATE POLICY "League stats are viewable by everyone." ON public.clasificacion_liga FOR SELECT USING (true);

-- Eventos: Everyone can read
DROP POLICY IF EXISTS "Events are viewable by everyone." ON public.eventos;
CREATE POLICY "Events are viewable by everyone." ON public.eventos FOR SELECT USING (true);

-- Jugadores: Everyone can read
DROP POLICY IF EXISTS "Players are viewable by everyone." ON public.jugadores;
CREATE POLICY "Players are viewable by everyone." ON public.jugadores FOR SELECT USING (true);

-- Attendance: Everyone can read. Only staff can write.
-- Refined: Players/Families can only read attendance of THEIR assigned players
DROP POLICY IF EXISTS "Attendance is viewable by everyone." ON public.asistencia;
CREATE POLICY "Attendance is viewable by everyone." ON public.asistencia FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND tipo_usuario IN ('staff', 'admin'))
  OR player_id IN (SELECT jugador_id FROM public.jugadores_propios WHERE usuario_id = auth.uid())
  OR player_id IN (SELECT jugador_id FROM public.jugador_familia WHERE usuario_id = auth.uid())
);
DROP POLICY IF EXISTS "Staff can manage attendance." ON public.asistencia;
CREATE POLICY "Staff can manage attendance." ON public.asistencia FOR ALL USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND tipo_usuario IN ('staff', 'admin'))
);

-- Physical Tests: Players/Families view their assigned ones. Staff view all.
DROP POLICY IF EXISTS "Players can view assigned physical tests." ON public.pruebas_fisicas;
CREATE POLICY "Players can view assigned physical tests." ON public.pruebas_fisicas FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND tipo_usuario IN ('staff', 'admin'))
  OR player_id IN (SELECT jugador_id FROM public.jugadores_propios WHERE usuario_id = auth.uid())
  OR player_id IN (SELECT jugador_id FROM public.jugador_familia WHERE usuario_id = auth.uid())
);
DROP POLICY IF EXISTS "Staff can manage physical tests." ON public.pruebas_fisicas;
CREATE POLICY "Staff can manage physical tests." ON public.pruebas_fisicas FOR ALL USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND tipo_usuario IN ('staff', 'admin'))
);

-- Game Stats: Same logic
DROP POLICY IF EXISTS "Players can view assigned stats." ON public.estadisticas_partido;
CREATE POLICY "Players can view assigned stats." ON public.estadisticas_partido FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND tipo_usuario IN ('staff', 'admin'))
  OR player_id IN (SELECT jugador_id FROM public.jugadores_propios WHERE usuario_id = auth.uid())
  OR player_id IN (SELECT jugador_id FROM public.jugador_familia WHERE usuario_id = auth.uid())
);
DROP POLICY IF EXISTS "Staff can manage game stats." ON public.estadisticas_partido;
CREATE POLICY "Staff can manage game stats." ON public.estadisticas_partido FOR ALL USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND tipo_usuario IN ('staff', 'admin'))
);

-- Relationship Tables Policies
DROP POLICY IF EXISTS "Users can view their own assignments." ON public.jugadores_propios;
CREATE POLICY "Users can view their own assignments." ON public.jugadores_propios FOR SELECT USING (usuario_id = auth.uid() OR EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND tipo_usuario IN ('staff', 'admin')));
DROP POLICY IF EXISTS "Users can view their own family assignments." ON public.jugador_familia;
CREATE POLICY "Users can view their own family assignments." ON public.jugador_familia FOR SELECT USING (usuario_id = auth.uid() OR EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND tipo_usuario IN ('staff', 'admin')));

-- 12. Trigger for automated profile creation (OPTIONAL BUT RECOMMENDED)
-- Creates a public profile entry automatically when a user signs up via auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, full_name, tipo_usuario)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', COALESCE((new.raw_user_meta_data->>'tipo_usuario')::user_role, 'player'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
