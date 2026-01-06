-- Add tipo_cliente column to profiles table
-- 'organico' = clients who register themselves
-- 'sintetico' = clients created by admin
ALTER TABLE public.profiles 
ADD COLUMN tipo_cliente text NOT NULL DEFAULT 'organico';

-- Add check constraint for valid values
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_tipo_cliente_check 
CHECK (tipo_cliente IN ('organico', 'sintetico'));

-- Make email nullable for synthetic clients
ALTER TABLE public.profiles 
ALTER COLUMN email DROP NOT NULL;