-- 1) Create a global sequence for order numbers (shared by admin + client)
CREATE SEQUENCE IF NOT EXISTS public.pedidos_numero_seq;

-- 2) Fix any existing non-"small" order numbers so they keep the same sequential flow
--    We treat numbers with 1-3 digits as the valid current sequence (001, 002, ...)
WITH base AS (
  SELECT COALESCE(MAX(numero_pedido::int), 0) AS max_seq
  FROM public.pedidos
  WHERE numero_pedido ~ '^[0-9]{1,3}$'
),
fix AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM public.pedidos
  WHERE NOT (numero_pedido ~ '^[0-9]{1,3}$')
)
UPDATE public.pedidos p
SET numero_pedido = LPAD((base.max_seq + fix.rn)::text, 3, '0')
FROM base, fix
WHERE p.id = fix.id;

-- 3) Align the sequence to the current maximum numeric order number
SELECT setval(
  'public.pedidos_numero_seq',
  COALESCE(
    (SELECT MAX(NULLIF(numero_pedido, '')::bigint) FROM public.pedidos WHERE numero_pedido ~ '^[0-9]+$'),
    0
  ),
  true
);

-- 4) Trigger to assign numero_pedido atomically at insert-time (prevents race conditions)
CREATE OR REPLACE FUNCTION public.set_pedido_numero()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.numero_pedido IS NULL OR NEW.numero_pedido = '' THEN
    NEW.numero_pedido := LPAD(nextval('public.pedidos_numero_seq')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_pedido_numero ON public.pedidos;
CREATE TRIGGER set_pedido_numero
BEFORE INSERT ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.set_pedido_numero();
