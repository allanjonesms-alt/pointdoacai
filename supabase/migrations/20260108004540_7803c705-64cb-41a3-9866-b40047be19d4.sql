-- Remove the foreign key constraint on profiles.id to allow synthetic clients
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;