-- Create enum for embalagem types
CREATE TYPE public.tipo_embalagem AS ENUM ('copo', 'isopor');

-- Add embalagem column to pedido_itens table
ALTER TABLE public.pedido_itens 
ADD COLUMN embalagem tipo_embalagem NOT NULL DEFAULT 'copo';