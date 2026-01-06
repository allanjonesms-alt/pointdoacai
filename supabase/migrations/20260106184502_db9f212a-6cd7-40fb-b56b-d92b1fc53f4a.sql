-- Add new status values to the enum
ALTER TYPE public.status_pedido ADD VALUE IF NOT EXISTS 'confirmado' AFTER 'pendente';
ALTER TYPE public.status_pedido ADD VALUE IF NOT EXISTS 'entregue' AFTER 'entrega';