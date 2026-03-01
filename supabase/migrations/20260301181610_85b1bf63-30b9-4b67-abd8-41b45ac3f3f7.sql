
ALTER TABLE public.pedidos 
ADD COLUMN pix_payment_id text DEFAULT NULL,
ADD COLUMN pix_pago_em timestamp with time zone DEFAULT NULL,
ADD COLUMN pix_confirmacao text DEFAULT NULL;
