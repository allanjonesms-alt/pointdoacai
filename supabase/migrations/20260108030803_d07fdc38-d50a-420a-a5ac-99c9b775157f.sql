-- Create table to track status history with timestamps
CREATE TABLE public.pedido_status_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  status status_pedido NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pedido_status_historico ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage status history"
ON public.pedido_status_historico
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all status history"
ON public.pedido_status_historico
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view status history of their orders"
ON public.pedido_status_historico
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM pedidos 
  WHERE pedidos.id = pedido_status_historico.pedido_id 
  AND pedidos.cliente_id = auth.uid()
));

-- Create index for faster queries
CREATE INDEX idx_pedido_status_historico_pedido_id ON public.pedido_status_historico(pedido_id);

-- Create trigger function to automatically log status changes
CREATE OR REPLACE FUNCTION public.log_pedido_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log on insert (new order)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.pedido_status_historico (pedido_id, status)
    VALUES (NEW.id, NEW.status);
    RETURN NEW;
  END IF;
  
  -- Log on status change
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.pedido_status_historico (pedido_id, status)
    VALUES (NEW.id, NEW.status);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on pedidos table
CREATE TRIGGER on_pedido_status_change
AFTER INSERT OR UPDATE ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.log_pedido_status_change();