-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'cliente');

-- Create enum for order status
CREATE TYPE public.status_pedido AS ENUM ('pendente', 'preparo', 'pronto', 'entrega');

-- Create enum for payment methods
CREATE TYPE public.forma_pagamento AS ENUM ('credito', 'debito', 'pix', 'dinheiro');

-- Create enum for product sizes
CREATE TYPE public.tamanho_produto AS ENUM ('pequeno', 'medio', 'grande', 'gg', 'mega');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  rua TEXT NOT NULL DEFAULT '',
  numero TEXT NOT NULL DEFAULT '',
  bairro TEXT NOT NULL DEFAULT '',
  complemento TEXT,
  referencia TEXT,
  valor_total_compras DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create products table
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tamanho tamanho_produto NOT NULL,
  peso TEXT NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create adicionals table
CREATE TABLE public.adicionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_pedido TEXT NOT NULL UNIQUE,
  cliente_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cliente_nome TEXT NOT NULL,
  endereco_rua TEXT NOT NULL,
  endereco_numero TEXT NOT NULL,
  endereco_bairro TEXT NOT NULL,
  endereco_complemento TEXT,
  endereco_referencia TEXT,
  forma_pagamento forma_pagamento NOT NULL,
  status status_pedido NOT NULL DEFAULT 'pendente',
  valor_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order items table
CREATE TABLE public.pedido_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID REFERENCES public.pedidos(id) ON DELETE CASCADE NOT NULL,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE SET NULL,
  produto_nome TEXT NOT NULL,
  tamanho tamanho_produto NOT NULL,
  peso TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_adicionais DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order item adicionals table
CREATE TABLE public.pedido_item_adicionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_item_id UUID REFERENCES public.pedido_itens(id) ON DELETE CASCADE NOT NULL,
  adicional_nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adicionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_item_adicionais ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, telefone, email, rua, numero, bairro, complemento, referencia)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'telefone', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'rua', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'numero', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'bairro', ''),
    NEW.raw_user_meta_data ->> 'complemento',
    NEW.raw_user_meta_data ->> 'referencia'
  );
  
  -- Default role is 'cliente'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cliente');
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_adicionais_updated_at
  BEFORE UPDATE ON public.adicionais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles (only admins can manage roles)
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for produtos (public read, admin write)
CREATE POLICY "Anyone can view active products"
  ON public.produtos FOR SELECT
  USING (ativo = true);

CREATE POLICY "Admins can view all products"
  ON public.produtos FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage products"
  ON public.produtos FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for adicionais (public read, admin write)
CREATE POLICY "Anyone can view active adicionals"
  ON public.adicionais FOR SELECT
  USING (ativo = true);

CREATE POLICY "Admins can view all adicionals"
  ON public.adicionais FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage adicionals"
  ON public.adicionais FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for pedidos
CREATE POLICY "Clients can view their own orders"
  ON public.pedidos FOR SELECT
  USING (auth.uid() = cliente_id);

CREATE POLICY "Clients can create orders"
  ON public.pedidos FOR INSERT
  WITH CHECK (auth.uid() = cliente_id);

CREATE POLICY "Admins can view all orders"
  ON public.pedidos FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage orders"
  ON public.pedidos FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for pedido_itens
CREATE POLICY "Users can view items of their orders"
  ON public.pedido_itens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pedidos
      WHERE pedidos.id = pedido_itens.pedido_id
      AND pedidos.cliente_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert items to their orders"
  ON public.pedido_itens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pedidos
      WHERE pedidos.id = pedido_itens.pedido_id
      AND pedidos.cliente_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items"
  ON public.pedido_itens FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage order items"
  ON public.pedido_itens FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for pedido_item_adicionais
CREATE POLICY "Users can view adicionals of their order items"
  ON public.pedido_item_adicionais FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pedido_itens
      JOIN public.pedidos ON pedidos.id = pedido_itens.pedido_id
      WHERE pedido_itens.id = pedido_item_adicionais.pedido_item_id
      AND pedidos.cliente_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert adicionals to their order items"
  ON public.pedido_item_adicionais FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pedido_itens
      JOIN public.pedidos ON pedidos.id = pedido_itens.pedido_id
      WHERE pedido_itens.id = pedido_item_adicionais.pedido_item_id
      AND pedidos.cliente_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order item adicionals"
  ON public.pedido_item_adicionais FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage order item adicionals"
  ON public.pedido_item_adicionais FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));