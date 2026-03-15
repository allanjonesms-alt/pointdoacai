-- Habilita a extensão http para chamadas HTTP dentro do banco
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Cria a função que dispara a notificação via HTTP ao inserir pedido
CREATE OR REPLACE FUNCTION public.notify_new_pedido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM extensions.http((
    'POST',
    'https://xleotnpiheyylvchfyhg.supabase.co/functions/v1/notificar-pedido',
    ARRAY[
      extensions.http_header('Content-Type', 'application/json'),
      extensions.http_header('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZW90bnBpaGV5eWx2Y2hmeWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NDIxMjUsImV4cCI6MjA4MzIxODEyNX0.Hgd6znRXoc_DRZdGSvmZasETJBHEUYNU2swWHhj-I0A')
    ],
    'application/json',
    row_to_json(NEW)::text
  )::extensions.http_request);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

-- Cria o trigger após cada INSERT na tabela pedidos
DROP TRIGGER IF EXISTS trigger_notify_new_pedido ON public.pedidos;
CREATE TRIGGER trigger_notify_new_pedido
  AFTER INSERT ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_pedido();