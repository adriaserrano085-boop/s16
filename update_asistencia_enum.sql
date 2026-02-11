-- Add missing values to Asistencia enum to match user requirement
-- You must run this in the Supabase SQL Editor

ALTER TYPE "Asistencia" ADD VALUE IF NOT EXISTS 'Lesion';
-- User image specifies 'Emfermo' (with 'm'). We add it as is.
ALTER TYPE "Asistencia" ADD VALUE IF NOT EXISTS 'Emfermo';

-- Ensure 'Enfermo' is also there just in case of future typo correction
ALTER TYPE "Asistencia" ADD VALUE IF NOT EXISTS 'Enfermo';

-- Verify the new values
SELECT enum_range(NULL::"Asistencia");
