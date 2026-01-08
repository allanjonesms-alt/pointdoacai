-- Remove the foreign key constraint on pedidos.cliente_id to allow orders for synthetic clients
ALTER TABLE public.pedidos DROP CONSTRAINT IF EXISTS pedidos_cliente_id_fkey;
ALTER TABLE public.pedidos DROP CONSTRAINT IF EXISTS pedidos_client_id_fkey;